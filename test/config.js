const StellarSdk = require("stellar-sdk");

// This overrides the jest buffer's prototype for compatability with nacl
Object.setPrototypeOf(global.Buffer.prototype, global.Uint8Array.prototype);

class psuedoRes {
  constructor(callback) {
    this.sendCallback = callback;
  }
  status(val) {
    return this;
  }
  send(val) {
    return this.sendCallback(val);
  }
}

const dec = require('../server/utils/dec');

global.signObject = (messageObject, secretKey) => {
  const stringifiedObject = JSON.stringify(messageObject);
  const msg = dec(stringifiedObject);
  const signed = require('tweetnacl').sign.detached(msg, secretKey);
  return JSON.stringify(Array.from(signed));
};

process.env.TOKEN_GRAVEYARD_ADDRESS = StellarSdk.Keypair.random().publicKey();

global.shareTransaction = require("./utils").shareTransaction;
global.shareTransactionWithKeypair = require("./utils").shareTransactionWithKeypair;
global.createOriginTransaction = require("./utils").createOriginTransaction;

global.psuedoRes = psuedoRes;
