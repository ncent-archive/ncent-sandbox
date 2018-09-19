const db = require('../../../server/models');
const TokenType = db.TokenType;
const Wallet = db.Wallet;
const StellarSdk = require('stellar-sdk');

describe('Wallet Model', () => {
  let wallet;
  let walletTemplate;

  beforeEach(async (done) => {
    const keypair1 = StellarSdk.Keypair.random();
    walletTemplate = { address: keypair1.publicKey() };
    wallet = await Wallet.create(walletTemplate);
    done();
  });

  afterEach(async (done) => {
    await Wallet.destroy({where: {}});
    done();
  });

  it('returns an instance with correct values', async (done) => {
    expect(typeof wallet).toBe('object');
    expect(typeof wallet.uuid).toBe('string');
    expect(wallet.address).toBe(walletTemplate.address);
    done();
  });

  it ('persists the created Wallet', async (done) => {
    const retrievedWallet = await Wallet.findById(wallet.uuid);
    expect(retrievedWallet).not.toBe(undefined);
    done();
  });
});
