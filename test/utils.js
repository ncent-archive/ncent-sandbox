const StellarSdk = require('stellar-sdk');
const transactions = require('../server/controllers').transactions;
const db = require('../server/models');
const TokenType = db.TokenType;
const Wallet = db.Wallet;
const Transaction = db.Transaction;

// Takes a sender keypair and tokenId, returns receiver keypair
const createTestTransaction = async (senderKeypair, tokenId, amount, callback) => {
  const senderPrivate = senderKeypair._secretKey;
  const receiverKeypair = StellarSdk.Keypair.random();
  const messageObj = {
    fromAddress: senderKeypair.publicKey(),
    toAddress: receiverKeypair.publicKey(),
    amount
  };
  const signed = signObject(messageObj, senderPrivate);
  messageObj.signed = signed;
  const transactionObject = await transactions.create({
    body: messageObj,
    params: {tokentype_uuid: tokenId}
  }, new psuedoRes(async (resolvedTransaction) => {
      callback({
        transaction: resolvedTransaction,
        receiverKeypair
      });
    }));
};

module.exports = { createTestTransaction };
