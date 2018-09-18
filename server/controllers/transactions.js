const Transaction = require("../models").Transaction;
const Wallet = require("../models").Wallet;
const TokenType = require("../models").TokenType;
const nacl = require("tweetnacl");
const StellarSdk = require("stellar-sdk");
const dec = require("../utils/dec.js");

const GENESIS_PARENT_UUID = "00000000-0000-0000-0000-000000000000";

const getOldestTransaction = async (walletUuid, tokenUuid) => {
  const transactions = await Transaction.findAll({
    where: {
      toAddress: walletUuid,
      tokentype_uuid: tokenUuid
    },
    order: [["updatedAt", "DESC"]] // newest to oldest
  });
  const parentTransactionUuids = new Set();
  transactions.forEach((transaction)=>{
    parentTransactionUuids.add(transaction.parentTransaction);
  });
  for (let i = transactions.length - 1; i >= 0; i--) {
    const transaction = transactions[i];
    if (!parentTransactionUuids.has(transaction.uuid)) {
      return transaction;
    }
  }
};

const getProvenanceChain = async (transaction) => {
  // Transaction chain order: (genesis -> ... -> redeemer)
  const transactionChain = [];
  do {
    transactionChain.unshift(transaction);
    transaction = await Transaction.findById(transaction.parentTransaction);
  } while (transaction);
  return transactionChain;
}

module.exports = {
  async create({ body, params }, res) {
    const tokenTypeUuid = params.tokentype_uuid;
    const { fromAddress, toAddress, signed } = body;
    const verifyingPublicKey = StellarSdk.StrKey.decodeEd25519PublicKey(fromAddress);
    let senderWallet = await Wallet.findOne({ where: {
      wallet_uuid: fromAddress,
      tokentype_uuid: tokenTypeUuid
    }});
    let receiverWallet = await Wallet.findOne({ where: {
      wallet_uuid: toAddress,
      tokentype_uuid: tokenTypeUuid
    }});
    const tokenType = await TokenType.findById(tokenTypeUuid);
    let msg;
    let amount;
    let parentTransactionUuid;
    if (tokenType.sponsor_uuid === fromAddress) {
      amount = parseInt(body.amount, 10);
      parentTransactionUuid = GENESIS_PARENT_UUID;
      msg = dec(JSON.stringify({
        fromAddress,
        toAddress,
        amount
      }));
    } else {
      parentTransactionUuid = body.parentTransactionUuid;
      const parentTransaction = await Transaction.findById(parentTransactionUuid);
      amount = parentTransaction.amount;
      msg = dec(JSON.stringify({
        fromAddress,
        toAddress,
        parentTransactionUuid
      }));
    }
    const verified = nacl.sign.detached.verify(
      msg,
      Uint8Array.from(JSON.parse(signed)),
      verifyingPublicKey
    );
    if (!verified) {
      return res.status(403).send({ message: "Failed Signing Transaction" });
    }
    if (!senderWallet) {
      return res.status(404).send({ message: "Balance for Wallet Not Found" });
    }
    const newAmount = senderWallet.balance - amount;
    if (newAmount < 0) {
      return res.status(403).send({ message: "Inadequate Balance" });
    }
    senderWallet = await senderWallet.update({ balance: newAmount });
    if (!receiverWallet) {
      receiverWallet = await Wallet.create({
        wallet_uuid: toAddress,
        tokentype_uuid: tokenTypeUuid
      });
    }
    receiverWallet = await receiverWallet.update({ balance: receiverWallet.balance + amount });
    const transaction = await Transaction.create({
      amount: amount,
      fromAddress: fromAddress,
      toAddress: toAddress,
      tokentype_uuid: tokenTypeUuid,
      parentTransaction: parentTransactionUuid
    });;
    const data = {
      sender: senderWallet,
      receiver: receiverWallet,
      txn: transaction
    }
    res.status(200).send(data);
  },

  list(req, res) {
    return Transaction.findAll({})
      .then(transactions => res.status(200).send(transactions))
      .catch(error => res.status(400).send(error));
  },

  async oldestProvenanceChain({ params }, res) {
    const walletUuid = params.wallet_uuid;
    const tokenUuid = params.tokentype_uuid;
    const tokenTypeExists = await TokenType.findById(tokenUuid);
    const walletExists = await Wallet.findOne({
      where: {
        wallet_uuid: walletUuid
      }
    });
    if (!tokenTypeExists) {
      return res.status(404).send({ message: "tokentype_uuid is invalid" });
    }
    if (!walletExists) {
      return res.status(404).send({ message: "wallet_uuid is invalid" });
    }
    const oldestTxn = await getOldestTransaction(walletUuid, tokenUuid);
    const transactionChain = await getProvenanceChain(oldestTxn);
    return res.status(200).send(transactionChain);
  },

  async provenanceChain({ params }, res) {
    let transaction = await Transaction.findById(params.transaction_uuid);
    if (!transaction) {
      return res.status(404).send({ message: "transactionUuid is invalid"});
    }
    const transactionChain = await getProvenanceChain(transaction);
    return res.status(200).send(transactionChain);
  }
};
