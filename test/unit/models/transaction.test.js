const db = require('../../../server/models')
const TokenType = db.TokenType;
const Transaction = db.Transaction;
const StellarSdk = require('stellar-sdk');

describe('Transaction Model', async () => {
  let tokenType;
  let transaction;
  let tokenTypeTemplate;
  let transactionTemplate;

  beforeEach(async (done) => {
    const keypair1 = StellarSdk.Keypair.random();
    const keypair2 = StellarSdk.Keypair.random();
    tokenTypeTemplate = {
      name: 'tokenName',
      expiryDate: '2020',
      sponsorUuid: keypair1.publicKey(),
      totalTokens: 10000,
    };
    tokenType = await TokenType.create(tokenTypeTemplate);
    transactionTemplate = {
      tokenTypeUuid: tokenType.uuid,
      amount: 1000,
      fromAddress: keypair1.publicKey(),
      toAddress: keypair2.publicKey(),
    };
    transaction = await Transaction.create(transactionTemplate);
    done();
  });

  afterEach(async (done) => {
    await Transaction.destroy({where: {}});
    await TokenType.destroy({where: {}});
    done();
  });

  it('returns an instance with correct values', async (done) => {
    expect(typeof transaction).toBe('object');
    expect(transaction.tokenTypeUuid).toBe(tokenType.uuid);
    expect(typeof transaction.uuid).toBe('string');
    expect(transaction.amount).toBe(transactionTemplate.amount);
    expect(transaction.fromAddress).toBe(transactionTemplate.fromAddress);
    expect(transaction.toAddress).toBe(transactionTemplate.toAddress);
    done();
  });

  it ('persists the created Transaction', async (done) => {
    const retrievedTransaction = await Transaction.findById(transaction.uuid);
    expect(retrievedTransaction).not.toBe(undefined);
    done();
  });
});
