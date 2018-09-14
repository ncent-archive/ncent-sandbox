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
    tokenType = await TokenType.create({
      Name: 'tokenName',
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
    it('returns all created wallets', async (done) => {
      const tests = (res) => {
        const receivedWallet = res[0];
        expect(receivedWallet).not.toBe(undefined);
        expect(receivedWallet.uuid).toBe(wallet.uuid);
        done();
      }
      wallets.listAll({}, new psuedoRes(tests));
    })
  });

  describe('listSome', () => {
    it('returns wallets matching public key param', async (done) => {
      const tests = (res) => {
        const receivedWallet = res[0];
        expect(receivedWallet).not.toBe(undefined);
        expect(receivedWallet.uuid).toBe(wallet.uuid);
        done();
      }
      wallets.listSome({
        params: {
          wallet_uuid: wallet.wallet_uuid
        }
      }, new psuedoRes(tests));
    })
  });

  describe('retrieve', () => {
    it('returns wallet matching public key + token params', async (done) => {
      const tests = (res) => {
        const receivedWallet = res[0];
        expect(receivedWallet).not.toBe(undefined);
        expect(receivedWallet.uuid).toBe(wallet.uuid);
        done();
      }
      wallets.retrieve({
        params: {
          wallet_uuid: wallet.wallet_uuid,
          tokentype_uuid: tokenType.uuid
        }
      }, new psuedoRes(tests));
    })
  });

});
