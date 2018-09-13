const db = require('../../../server/models');
const TokenType = db.TokenType;
const Wallet = db.Wallet;
const StellarSdk = require('stellar-sdk');

describe('Wallet Model', () => {
  let tokenType;
  let wallet;
  let tokenTypeTemplate;
  let walletTemplate;

  beforeEach(async (done) => {
    const keypair1 = StellarSdk.Keypair.random();
    tokenTypeTemplate = {
      Name: Math.random().toString(36).slice(2),
      ExpiryDate: '2020',
      sponsor_uuid: keypair1.publicKey(),
      totalTokens: 10000,
    };
    tokenType = await TokenType.create(tokenTypeTemplate);
    walletTemplate = {
      wallet_uuid: keypair1.publicKey(),
      tokentype_uuid: tokenType.uuid,
      balance: 10000
    };
    wallet = await Wallet.create(walletTemplate);
    done();
  });

  afterEach(async (done) => {
    await Wallet.destroy({where: {}});
    await TokenType.destroy({where: {}});
    done();
  });

  it('returns an instance with correct values', async (done) => {
    expect(typeof wallet).toBe('object');
    expect(typeof wallet.uuid).toBe('string');
    expect(wallet.wallet_uuid).toBe(walletTemplate.wallet_uuid);
    expect(wallet.tokentype_uuid).toBe(tokenType.uuid);
    expect(wallet.balance).toBe(walletTemplate.balance);
    done();
  });

  it ('persists the created Wallet', async (done) => {
    const retrievedWallet = await Wallet.findById(wallet.uuid);
    expect(retrievedWallet).not.toBe(undefined);
    done();
  });
});
