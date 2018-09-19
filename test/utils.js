const StellarSdk = require('stellar-sdk');
const transactions = require('../server/controllers').transactions;

const createOriginTransaction = async (senderKeypair, tokenId, amount, callback) => {
  const senderPrivate = senderKeypair._secretKey;
  const messageObj = { amount };
  const signed = signObject(messageObj, senderPrivate);
  messageObj.signed = signed;
  await transactions.create({
    body: messageObj,
    params: { address: senderKeypair.publicKey(), tokenTypeUuid: tokenId }
  }, new psuedoRes(async (resolvedTransaction) => {
    callback(resolvedTransaction);
  }));
};

// Takes a sender keypair and tokenId, returns receiver keypair
const shareTransaction = async (senderKeypair, transactionUuid, callback) => {
  const senderPrivate = senderKeypair._secretKey;
  const receiverKeypair = StellarSdk.Keypair.random();
  const messageObj = {
    fromAddress: senderKeypair.publicKey(),
    toAddress: receiverKeypair.publicKey()
  };
  const signed = signObject(messageObj, senderPrivate);
  messageObj.signed = signed;
  await transactions.share({
    body: messageObj,
    params: { transactionUuid }
  }, new psuedoRes(async (resolvedTransaction) => {
      callback({
        transaction: resolvedTransaction,
        receiverKeypair
      });
    }));
};

const shareTransactionWithKeypair = async (senderKeypair, receiverKeypair, transactionUuid, callback) => {
  const senderPrivate = senderKeypair._secretKey;
  const messageObj = {
    fromAddress: senderKeypair.publicKey(),
    toAddress: receiverKeypair.publicKey()
  };
  const signed = signObject(messageObj, senderPrivate);
  messageObj.signed = signed;
  await transactions.create({
    body: messageObj,
    params: { transactionUuid }
  }, new psuedoRes(async (resolvedTransaction) => {
    callback({
      transaction: resolvedTransaction,
      receiverKeypair
    });
  }));
};

module.exports = {
  shareTransaction,
  shareTransactionWithKeypair,
  createOriginTransaction
};
