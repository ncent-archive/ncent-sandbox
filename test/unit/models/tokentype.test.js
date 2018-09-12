const Models = require('../../../server/models')
const TokenType = Models.TokenType;
const Transaction = Models.Transaction;
const StellarSdk = require('stellar-sdk');

describe('TokenType model', () => {
  let tokenType;
  const keypair = Object.freeze(StellarSdk.Keypair.random());
  const tokenTypeTemplate = Object.freeze({
    Name: 'testTokenName',
    ExpiryDate: '2020',
    sponsor_uuid: keypair.publicKey(),
    totalTokens: 10000,
  });

  beforeEach(async (done) => {
    tokenType = await TokenType.create(tokenTypeTemplate);
    done();
  });

  afterEach(async (done) => {
    await tokenType.destroy();
    done();
  });

  it('returns an instance with the given values', async (done) => {
    expect(typeof tokenType).toBe('object');
    expect(tokenType.Name).toBe(tokenTypeTemplate.Name);
    expect(tokenType.ExpiryDate.getTime()).toBe(
      new Date(tokenTypeTemplate.ExpiryDate).getTime()
    );
    expect(typeof tokenType.uuid).toBe('string');
    expect(tokenType.sponsor_uuid).toBe(tokenTypeTemplate.sponsor_uuid);
    expect(tokenType.totalTokens).toBe(tokenTypeTemplate.totalTokens);
    done();
  });

  it ('persists the created TokenType', async (done) => {
    const retrievedToken = await TokenType.findById(tokenType.uuid);
    expect(retrievedToken).not.toBe(undefined);
    done();
  });

  it ('creates an association with the Transaction model', async (done) => {
    const keypair1 = StellarSdk.Keypair.random();
    const keypair2 = StellarSdk.Keypair.random();
    const transactionTemplate = {
      tokentype_uuid: tokenType.uuid,
      amount: 1000,
      fromAddress: keypair1.publicKey(),
      toAddress: keypair2.publicKey(),
    };
    const transaction = await Transaction.create(transactionTemplate);
    const tokenWithTransactions = await TokenType.findById(tokenType.uuid, {
      include: [{
        model: Transaction,
        as: 'transactions',
      }],
    })
    const retrievedTransaction = tokenWithTransactions['transactions'][0];
    expect (retrievedTransaction.tokentype_uuid).toBe(tokenType.uuid);
    done();
  });
});