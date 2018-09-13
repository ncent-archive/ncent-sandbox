const Transaction = require('../models').Transaction;
const Wallet = require('../models').Wallet;
const nacl = require('tweetnacl');
const StellarSdk = require('stellar-sdk');

module.exports = {
  create(req, res) {
    let data;
    let dec = function(s) {
      if (typeof atob === 'undefined') {
        return new Uint8Array(Array.prototype.slice.call(Buffer.from(s, 'base64'), 0));
      } else {
        let i, d = atob(s), b = new Uint8Array(d.length);
        for (i = 0; i < d.length; i++) b[i] = d.charCodeAt(i);
        return b;
      }
    };
    // get the wallet from the public key string, so we can use the Uint8array version of public key for verification
    const verifying_wallet = StellarSdk.Keypair.fromPublicKey(req.body.fromAddress);
    // remake the message string from the parameters
    const message_obj = {fromAddress: req.body.fromAddress, toAddress: req.body.toAddress, amount: req.body.amount};
    const msg = dec(JSON.stringify(message_obj));
    // load the signed message as a Uint8array
    const signed = Uint8Array.from(JSON.parse(req.body.signed));
    // verify the transaction
    const verified = nacl.sign.detached.verify(msg, signed, verifying_wallet._publicKey); // returns boolean
    if (!verified) {
      res.status(403).send({
        message: 'Failed Signing Transaction',
      });
      return;
    }
    Wallet.findAll({
      where: {
        wallet_uuid: req.body.fromAddress,
        tokentype_uuid: req.params.tokentype_uuid,
      }
    })
    .then(function(senderWallets) {
      if (!senderWallets || senderWallets.length < 1 ) {
        throw new Error("Balance for Wallet Not Found");
      }
      if (parseInt(senderWallets[0].balance, 10) - parseInt(req.body.amount, 10) < 0 ) {
        throw new Error("Inadequate Balance");
      }
      return senderWallets[0].update({
        balance: parseInt(senderWallets[0].balance, 10) - parseInt(req.body.amount, 10),
      });
    })
    .then(function(updatedSdrWallets) {
      data = {sender: updatedSdrWallets};
      return Wallet.findAll({
        where: {
          wallet_uuid: req.body.toAddress,
          tokentype_uuid: req.params.tokentype_uuid,
        }
      });
    })
    .then(function(receiverWallets) {
      if (!receiverWallets || receiverWallets.length < 1 ) {
        return Wallet
        .create({
          wallet_uuid: req.body.toAddress,
          tokentype_uuid: req.params.tokentype_uuid,
        });
      } else {
        return receiverWallets[0];
      }
    })
    .then(function(rspnse) {
      return rspnse.update({
        balance: parseInt(rspnse.balance, 10) + parseInt(req.body.amount, 10),
      });
    })
    .then(function(updatedRecWallets) {
      data["receiver"] = updatedRecWallets;
      return Transaction.create({
        amount: req.body.amount,
        fromAddress: req.body.fromAddress,
        toAddress: req.body.toAddress,
        tokentype_uuid: req.params.tokentype_uuid
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
};
