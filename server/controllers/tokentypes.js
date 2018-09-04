const TokenType = require('../models').TokenType;
const Transaction = require('../models').Transaction;
const Wallet = require('../models').Wallet;
const nacl = require('tweetnacl');
const StellarSdk = require('stellar-sdk');

module.exports = {
  create(req, res) {
    let data;
    TokenType.create({
      Name: req.body.Name,
      ExpiryDate: req.body.ExpiryDate,
      sponsor_uuid: req.body.sponsor_uuid,
      totalTokens: req.body.totalTokens,
      // ProvenanceLength: req.body.ProvenanceLength,
      // Lambda: req.body.Lambda,
    })
    .then(function(tokentype) {
      data = {token: tokentype};
      return Wallet
      .create({
        wallet_uuid: req.body.sponsor_uuid,
        tokentype_uuid: tokentype.dataValues.uuid,
        balance: req.body.totalTokens,
      })
    })
    .then(function(wllet) {
      data["wallet"] = wllet;
      return res.status(200).send(data);
    })
    .catch(error => res.status(400).send(error));
  },
  list(req, res) {
    return TokenType
      .findAll({
        include: [{
          model: Transaction,
          as: 'transactions',
        }],
      })
      .then(tokentypes => res.status(200).send(tokentypes))
      .catch(error => res.status(400).send(error));
  },
  retrieve(req, res) {
    return TokenType
      .findById(req.params.tokentype_uuid, {
        include: [{
          model: Transaction,
          as: 'transactions',
        }],
      })
      .then(tokentype => {
        if (!tokentype) {
          return res.status(404).send({
            message: 'TokenType Not Found',
          });
        } else {
          return res.status(200).send(tokentype);
        }
      })
      .catch(error => res.status(400).send(error));
  },
  update(req, res) {
    return TokenType
      .findById(req.params.tokentype_uuid, {
        include: [{
          model: Transaction,
          as: 'transactions',
        }],
      })
      .then(tokentype => {
        let dec = function(s) {
          if (typeof atob === 'undefined') {
            return new Uint8Array(Array.prototype.slice.call(new Buffer(s, 'base64'), 0));
          } else {
            let i, d = atob(s), b = new Uint8Array(d.length);
            for (i = 0; i < d.length; i++) b[i] = d.charCodeAt(i);
            return b;
          }
        };
        // get the wallet from the public key string, so we can use the Uint8array version of public key for verification
        const verifying_wallet = StellarSdk.Keypair.fromPublicKey(req.body.publicKey);
        // remake the message string from the parameters
        const message_obj = {tokentype_id: req.params.tokentype_uuid};
        const msg = dec(JSON.stringify(message_obj));
        // load the signed message as a Uint8array
        const signed = Uint8Array.from(JSON.parse(req.body.signed));
        // verify the transaction
        const verified = nacl.sign.detached.verify(msg, signed, verifying_wallet._publicKey); // returns boolean
        if (!verified) {
          throw new Error("Failed Signing Transaction");
        }
        let currentDate = new Date();
        if (!tokentype) {
          return res.status(404).send({
            message: 'TokenType Not Found',
          });
        } else {
          return tokentype.update({
            ExpiryDate: currentDate.getTime()
          })
          .then(() => res.status(200).send(tokentype))  // Send back the updated tokentype.
          .catch((error) => res.status(400).send(error));
        }
      })
      .catch(function(error) {
        if (error.message)
        res.status(403).send({
          message: 'Failed Signing Transaction',
        });
        res.status(400).send(error);
      });
  },
};