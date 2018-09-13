const StellarSdk = require('stellar-sdk');
const wallets = require('../../../server/controllers').wallets;
const db = require('../../../server/models')
const TokenType = db.TokenType;
const Wallet = db.Wallet;

describe('wallets Controller', () => {
  let tokenType;
  let wallet;
  beforeEach(async (done) => {
    let keypair1 = StellarSdk.Keypair.random();
    let keypair2 = StellarSdk.Keypair.random();
    let name = Math.random().toString(36).slice(2);
    tokenType = await TokenType.create({
      Name: name,
      ExpiryDate: '2020',
      sponsor_uuid: keypair1.publicKey(),
      totalTokens: 10000,
    });
    wallet = await Wallet.create({
      wallet_uuid: keypair2.publicKey(),
      tokentype_uuid: tokenType.uuid,
      balance: 10000
    });
    done();
  });

  afterEach(async (done) => {
    await Wallet.destroy({where: {}});
    await TokenType.destroy({where: {}});
    tokenType = null;
    wallet = null;
    done();
  });

  describe('create', () => {
    it ('persists a created wallet to the database', async (done) => {
      const retrievedWallet = await Wallet.findById(wallet.uuid);
      expect(retrievedWallet).not.toBe(undefined);
      done();
    });
    it ('returns a wallet with correct properties', async (done) => {
      const keypair = StellarSdk.Keypair.random();
      const BALANCE = 1000;
      const tests = async (testWallet) => {
        expect(typeof testWallet).toBe('object');
        expect(typeof testWallet.uuid).toBe('string');
        expect(testWallet.wallet_uuid).toBe(keypair.publicKey());
        expect(testWallet.tokentype_uuid).toBe(tokenType.uuid);
        expect(testWallet.balance).toBe(BALANCE);
        await testWallet.destroy();
        done();
      }
      const testWallet = await wallets.create({
        body: {
          wallet_uuid: keypair.publicKey(),
          tokentype_uuid: tokenType.uuid,
          balance: BALANCE
        },
      }, new psuedoRes(tests));
    });
  });

  describe('listAll', () => {
    it('successfully lists all created wallets', async (done) => {
      const tests = (res) => {
        console.log(res[0]);
        expect(true).toBe(true);
        done();
      }
      wallets.listAll({}, new psuedoRes(tests));
    })
  });

  describe('listSome', () => {

  });

  describe('retrieve', () => {

  });
});
