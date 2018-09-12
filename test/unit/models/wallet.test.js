const db = require('../../../server/models')
const TokenType = db.TokenType;
const Wallet = db.Wallet;
const Transaction = db.Transaction;
const StellarSdk = require('stellar-sdk');

describe('Wallet Model', () => {
  let tokenType;
  let wallet;
  const keypair1 = Object.freeze(StellarSdk.Keypair.random());
  const tokenTypeTemplate = Object.freeze({
    Name: 'TokenName',
    ExpiryDate: '2020',
    sponsor_uuid: keypair1.publicKey(),
    totalTokens: 10000,
  });
  const walletDetails = Object.freeze({
    wallet_uuid: keypair1.publicKey(),
    tokentype_uuid: '',
    balance: 10000
  });

  beforeEach(async (done) => {
    tokenType = await TokenType.create(tokenTypeTemplate);
    const walletTemplate =
      Object.assign({}, walletDetails, {tokentype_uuid: tokenType.uuid});
    wallet = await Wallet.create(walletTemplate);
    done();
  });

  afterEach(async (done) => {
    await tokenType.destroy();
    await wallet.destroy();
    done();
  });

  it('returns an instance with correct values', async (done) => {
    expect(typeof wallet).toBe('object');
    expect(wallet.wallet_uuid).toBe(walletDetails.wallet_uuid);
    expect(wallet.tokentype_uuid).toBe(tokenType.uuid);
    expect(wallet.balance).toBe(walletDetails.balance);
    done();
  });

});
