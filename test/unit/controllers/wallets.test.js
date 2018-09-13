const StellarSdk = require('stellar-sdk');
const wallets = require('../../../server/controllers').wallets;
const db = require('../../../server/models')
const TokenType = db.TokenType;
const Wallet = db.Wallet;

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

describe('wallets Controller', () => {
  let tokenType;
  let wallet;

  beforeEach(async (done) => {
    const keypair1 = StellarSdk.Keypair.random();
    tokenType = await TokenType.create({
      Name: Math.random().toString(36).slice(2),
      ExpiryDate: '2020',
      sponsor_uuid: keypair1.publicKey(),
      totalTokens: 10000,
    });
    wallet = await Wallet.create({
      wallet_uuid: keypair1.publicKey(),
      tokentype_uuid: tokenType.uuid,
      balance: 10000
    });
    done();
  });

  afterEach(async (done) => {
    await tokenType.destroy();
    await wallet.destroy();
    done();
  });

  describe('create', () => {
    it ('returns a wallet with correct properties', async (done) => {
      const keypair = StellarSdk.Keypair.random();
      const BALANCE = 1000;
      const tests = (testWallet) => {
        expect(typeof testWallet).toBe('object');
        expect(typeof testWallet.uuid).toBe('string');
        expect(testWallet.wallet_uuid).toBe(keypair.publicKey());
        expect(testWallet.tokentype_uuid).toBe(tokenType.uuid);
        expect(testWallet.balance).toBe(BALANCE);
      }
      const testWallet = await wallets.create({
        body: {
          wallet_uuid: keypair.publicKey(),
          tokentype_uuid: tokenType.uuid,
          balance: BALANCE
        },
      }, new psuedoRes(tests));
      done();
    });

    it ('persists a created wallet to the database', async (done) => {
      const retrievedWallet = await Wallet.findById( wallet.uuid);
      expect(retrievedWallet).not.toBe(undefined);
      done();
    });
  });

  // describe('listAll', () => {
  //
  // });
  //
  // describe('listSome', () => {
  //
  // });
  //
  // describe('retrieve', () => {
  //
  // });
});
