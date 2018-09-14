const Transaction = require('../models').Transaction;
const Wallet = require('../models').Wallet;
const nacl = require('tweetnacl');
const StellarSdk = require('stellar-sdk');
const dec = require('../utils/dec.js');

const getOldestTransaction = async (walletUuid, tokenUuid) => {
  const transaction = await Transaction.findAll({
    where: {
      toAddress: walletUuid,
      tokentype_uuid: tokenUuid
    },
    limit: 1,
    order: [['updatedAt', 'ASC']]
  });
  return transaction[0];
};

module.exports = {
  create({ body, params }, res) {
    let data;
    const { amount, fromAddress, toAddress, signed } = body;
    // get Uint8array version of publicKey for verification
    const verifyingWallet = StellarSdk.Keypair.fromPublicKey(fromAddress);
    // remake the messageObj from params
    const msg = dec(JSON.stringify({
        fromAddress,
        toAddress,
        amount
    }));
    const verified = nacl.sign.detached.verify(
      msg,
      Uint8Array.from(JSON.parse(signed)),
      verifyingWallet._publicKey
    );
    if (!verified) {
      res.status(403).send({
        message: 'Failed Signing Transaction',
      });
      return;
    }
    Wallet.findAll({
      where: {
        wallet_uuid: fromAddress,
        tokentype_uuid: params.tokentype_uuid,
      }
    })
    .then(function(senderWallets) {
      if (!senderWallets || senderWallets.length < 1 ) {
        throw new Error("Balance for Wallet Not Found");
      }
      if (parseInt(senderWallets[0].balance, 10) - parseInt(amount, 10) < 0 ) {
        throw new Error("Inadequate Balance");
      }
      return senderWallets[0].update({
        balance: parseInt(senderWallets[0].balance, 10) - parseInt(amount, 10),
      });
    })
    .then(function(updatedSdrWallets) {
      data = {sender: updatedSdrWallets};
      return Wallet.findAll({
        where: {
          wallet_uuid: toAddress,
          tokentype_uuid: params.tokentype_uuid,
        }
      });
    })
    .then(function(receiverWallets) {
      if (!receiverWallets || receiverWallets.length < 1 ) {
        return Wallet
        .create({
          wallet_uuid: toAddress,
          tokentype_uuid: params.tokentype_uuid,
        });
      } else {
        return receiverWallets[0];
      }
    })
    .then(function(rspnse) {
      return rspnse.update({
        balance: parseInt(rspnse.balance, 10) + parseInt(amount, 10),
      });
    })
    .then(function(updatedRecWallets) {
      data["receiver"] = updatedRecWallets;
      return Transaction.create({
        amount: amount,
        fromAddress: fromAddress,
        toAddress: toAddress,
        tokentype_uuid: params.tokentype_uuid
      });
    })
    .then(function(transaction) {
      data["txn"] = transaction;
      return res.status(200).send(data);
    })
    .catch(function(error) {
      if (error.message === "Balance for Wallet Not Found") {
        res.status(404).send({
          message: 'Balance for Wallet Not Found',
        });
      } else if (error.message === "Inadequate Balance") {
        res.status(403).send({
          message: 'Inadequate Balance',
        });
      } else {
        res.status(400).send(error);
      }
    });
  },

  list(req, res) {
    return Transaction
      .findAll({
      })
      .then(transactions => res.status(200).send(transactions))
      .catch(error => res.status(400).send(error));
  },

  async retrieveProvenanceChain({body, params}, res) {
    const walletUuid = body.wallet_uuid;
    const tokenUuid = params.tokentype_uuid;
    const transactionChain = [];
    let txn = await getOldestTransaction(walletUuid, tokenUuid);
    while (txn) {
      transactionChain.push(txn.dataValues);
      txn = await getOldestTransaction(txn['fromAddress'], tokenUuid);
    }
    if (transactionChain.length === 0) {
      return res.status(400).send({
        message: "The genesis node does not have a provenance chain"
      })
    } else {
      return res.status(200).send(transactionChain);
    }
  }
};
