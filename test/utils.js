const StellarSdk = require('stellar-sdk');
const transactions = require('../server/controllers').transactions;

const createOriginTransaction = async (senderKeypair, challengeUuid, numShares, callback) => {
    const senderPrivate = senderKeypair._secretKey;
    const messageObj = {numShares};
    messageObj.signed = signObject(messageObj, senderPrivate);
    await transactions.create({
        body: messageObj,
        params: {address: senderKeypair.publicKey(), challengeUuid}
    }, new psuedoRes(async (resolvedTransaction) => {
        callback(resolvedTransaction);
    }));
};

// Takes a sender keypair and tokenId, returns receiver keypair
const shareTransaction = async (senderKeypair, numShares, challengeUuid, callback) => {
    const senderPrivate = senderKeypair._secretKey;
    const receiverKeypair = StellarSdk.Keypair.random();
    const messageObj = {
        fromAddress: senderKeypair.publicKey(),
        toAddress: receiverKeypair.publicKey(),
        numShares
    };
    messageObj.signed = signObject(messageObj, senderPrivate);
    await transactions.share({
        body: messageObj,
        params: {challengeUuid}
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
    messageObj.signed = signObject(messageObj, senderPrivate);
    await transactions.share({
        body: messageObj,
        params: {transactionUuid}
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
