const { Transaction, Wallet, TokenType } = require('../models');
const nacl = require("tweetnacl");
const StellarSdk = require("stellar-sdk");
const dec = require("../utils/dec");

// Receives: wallet
// Returns: oldest transaction of a wallet that has no child transactions
const getOldestTransaction = async (wallet) => {
  const walletUuid = wallet.wallet_uuid;
  const tokenUuid = wallet.tokentype_uuid;
  const transactions = await Transaction.findAll({
      where: { toAddress: walletUuid, tokentype_uuid: tokenUuid },
      order: [["updatedAt", "DESC"]] // newest to oldest
  });
  const parentTransactionUuids = new Set();
  transactions.forEach((transaction) => {
      parentTransactionUuids.add(transaction.parentTransaction);
  });
  for (let i = transactions.length - 1; i >= 0; i--) {
      const transaction = transactions[i];
      if (!parentTransactionUuids.has(transaction.uuid)) {
          return transaction;
      }
  }
};
// Receives: Any transaction
// Returns: chain of transactions from initial challenge to given transaction
  // Order: (challenge -> ... -> transaction)
const getProvenanceChain = async (transaction) => {
  const transactionChain = []; 
  do {
      transactionChain.unshift(transaction);
      transaction = await Transaction.findById(transaction.parentTransaction);
  } while (transaction);
  return transactionChain;
}
// Receives: publicKey, tokenTypeUuid
// Returns: Boolean of whether this public key is the creator of a TokenType
const isTokenTypeCreator = async (walletUuid, tokenTypeUuid) => {
  const tokenType = await TokenType.findById(tokenTypeUuid);
  return (tokenType.sponsor_uuid === walletUuid);
};
// Receives: publicKey, tokenTypeUuid
// Returns: Finds a wallet (if one exists), with the given owner and tokenType
const getWallet = async (publicKey, tokenTypeUuid) => {
  const wallet = await Wallet.findOne({
    where: {
      tokentype_uuid: tokenTypeUuid,
      wallet_uuid: publicKey
    }
  });
  return wallet;
}

const getChildrenTransactions = async (parentTransaction) => {
  const childrenTransactions = await Transaction.findAll({
    where: { parentTransaction }
  });
  return childrenTransactions;
}

// Receives: publicKey as string, signed transaction, unsigned transaction
// Returns: Boolean: Was this signed by publicKey's secret key
const isVerified = (publicKeyStr, signed, reconstructedObject) => {
  const walletBuffer = StellarSdk.StrKey.decodeEd25519PublicKey(publicKeyStr);
  const decodedObject = dec(JSON.stringify(reconstructedObject));
  const verified = nacl.sign.detached.verify(
    decodedObject,
    Uint8Array.from(JSON.parse(signed)),
    walletBuffer
  );
  return verified;
}

const transactionsController = {
  // GET ()
    // -> [{transactionData}...{transactionData}]
  async list(req, res) {
    try {
        const allTransactions = await Transaction.findAll({});
        res.status(200).send(allTransactions);
    } catch(error) { res.status(400).send(error); }
  },
  // POST (params: {walletUuid, tokenTypeUuid}, body: {amount, signed})
    // -> createdTransaction // this is just the "challenge" issued to creator
  async create({body, params}, res) {
    const { walletUuid, tokenTypeUuid } = params;
    const signed = body.signed;
    const amount = parseInt(body.amount, 10);
    const wallet = await getWallet(walletUuid, tokenTypeUuid);
    if (!wallet) {
      return res.status(404).send({ message: "Wallet not found" });
    }
    const tokenType = await TokenType.findById(tokenTypeUuid);
    if (!tokenType) {
      return res.status(404).send({ message: "TokenType not found" });
    }
    if (tokenType.sponsor_uuid !== walletUuid) {
      return res.status(404).send({message:"Wallet !== TokenType sponsor"});
    }
    const reconstructedObject = { amount };
    if (!isVerified(walletUuid, signed, reconstructedObject)) {
      return res.status(403).send({ message: "Invalid transaction signing" });
    }
    const newWalletBalance = wallet.balance - amount;
    if (newWalletBalance < 0) {
      return res.status(403).send({ message: "Inadequate wallet balance" });
    }
    const transaction = await Transaction.create({
      amount: amount,
      fromAddress: walletUuid,
      toAddress: walletUuid,
      tokentype_uuid: tokenTypeUuid
    });
    res.status(200).send(transaction);
  },
  //POST (params: {transactionUuid}, body: {fromAddress, toAddress, signed})
    // -> transaction between fromAddress and toAddress, tranferring "challenge"
  async share({ body, params }, res) {
    const { transactionUuid } = params;
    const { fromAddress, toAddress, signed } = body;
    const transaction = await Transaction.findById(transactionUuid);
    if (!transaction) {
      return res.status(404).send({ message: "Transaction not found" });
    }
    if (!fromAddress === transaction.toAddress) {
      return res.status(403).send({ message: "Unauthorized to transfer transaction" });
    }
    const childrenTransactions = await getChildrenTransactions(transactionUuid);
    if (childrenTransactions.length > 0) {
      return res.status(403).send({ message: "This transaction has been transferred already" });
    }
    const tokenTypeUuid = transaction.tokentype_uuid;
    let fromWallet = await getWallet(fromAddress, tokenTypeUuid);
    if (!fromWallet) {
      return res.status(404).send({ message: "Invalid fromAddress" });
    }
    let toWallet = await getWallet(toAddress, tokenTypeUuid);
    if (!toWallet) {
      toWallet = await Wallet.create({
        wallet_uuid: toAddress,
        tokentype_uuid: tokenTypeUuid
      });
    }
    const reconstructedObject = { fromAddress, toAddress};
    if (!isVerified(fromAddress, signed, reconstructedObject)) {
      return res.status(403).send({ message: "Invalid transaction signing" });
    }
    fromWallet = await fromWallet.update({
      balance: fromWallet.balance - transaction.amount
    });
    toWallet = await toWallet.update({
      balance: toWallet.balance + transaction.amount
    });
    const newTransaction = await Transaction.create({
      toAddress,
      fromAddress,
      amount: transaction.amount,
      parentTransaction: transactionUuid,
      tokentype_uuid: tokenTypeUuid
    });
    const data = {
      fromWallet,
      toWallet,
      txn: newTransaction
    };
    res.status(200).send(data);
  },
  // GET (params: {transactionUuid})
    // -> [challengeTransaction, transaction2...transaction]
    // array of transactions leading to transaction w/ transactionUuid
  async provenanceChain({params}, res) {
    let transaction = await Transaction.findById(params.transactionUuid);
    if (!transaction) {
      return res.status(404).send({ message: "transactionUuid is invalid" });
    }
    if (transaction.toAddress === transaction.fromAddress) {
      return res.status(400).send({ message: "Challenge has no provenance" });
    }
    const transactionChain = await getProvenanceChain(transaction);
    res.status(200).send(transactionChain);
  },
  // GET (params: {walletUuid, tokenTypeUuid})
    // -> [challengeTransaction, transaction2...transaction]
    // returns provenanceChain of oldest "challenge" that hasn't been shared
  async provenanceChainFIFO({params}, res) {
    const { walletUuid, tokenTypeUuid } = params;
    const wallet = await getWallet(walletUuid, tokenTypeUuid);
    if (!wallet) {
      return res.status(404).send({ message: "Wallet not found" });
    }
    const tokenType = await TokenType.findById(tokenTypeUuid);
    if (!wallet) {
      return res.status(404).send({ message: "TokenType not found" });
    }
    const oldestOwnedTransaction = await getOldestTransaction(wallet);
    if (!oldestOwnedTransaction) {
      return res.status(404).send({ message: "No owned challenges" });
    }
    const transactionChain = await getProvenanceChain(oldestOwnedTransaction);
    res.status(200).send(transactionChain);
  },
  // POST (body: { transactionUuid, signed })
  // -> transaction w/ tokenGraveyard
  // async redeem({body}, res) {
  //   const { transactionUuid, signed } = body;
  //   const transaction = await Transaction.findById(transactionUuid);
  //   const {toAddress, tokentype_uuid, amount} = transaction;
  //   if (!transaction) {
  //     return res.status(404).send({ message: "Transaction not found" });
  //   }
  //   const reconstructedObject = { transactionUuid };
  //   if (!isVerified(transaction.sponsor_uuid, signed, reconstructedObject)) {
  //     return res.status(403).send({
  //       message: "Only the TokenType sponsor can trigger redemption"
  //     });
  //   }
  //   let redeemWallet = await getWallet(toAddress, tokentype_uuid);
  //   redeemWallet = await redeemWallet.update({
  //     balance: redeemWallet.balance - amount
  //   });
  //   const newTransaction = await Transaction.create({
  //     fromAddress: toAddress,
  //     toAddress: 'TOKEN_GRAVEYARD_PUBLIC_KEY_HERE',
  //     amount,
  //     tokentype_uuid
  //   });
  //   const data = {
  //     redeemWallet,
  //     txn: newTransaction
  //   };
  //   res.status(200).send(data);
  // }
};

module.exports = transactionsController;