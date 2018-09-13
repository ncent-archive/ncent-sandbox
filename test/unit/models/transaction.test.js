const db = require('../../../server/models')
const TokenType = db.TokenType;
const Transaction = db.Transaction;
const StellarSdk = require('stellar-sdk');

describe('Transaction Model', () => {
  let tokenType;
  let transaction;
  let tokenTypeTemplate;
  let transactionTemplate;

  beforeEach(async (done) => {
    const keypair1 = StellarSdk.Keypair.random();
    const keypair2 = StellarSdk.Keypair.random();
    tokenTypeTemplate = {
      Name: Math.random().toString(36).slice(2),
      ExpiryDate: '2020',
      sponsor_uuid: keypair1.publicKey(),
      totalTokens: 10000,
    };
    tokenType = await TokenType.create(tokenTypeTemplate);
    transactionTemplate = {
      tokentype_uuid: tokenType.uuid,
      amount: Math.floor(Math.random() * 1000) + 1,
      fromAddress: keypair1.publicKey(),
      toAddress: keypair2.publicKey(),
    };
    transaction = await Transaction.create(transactionTemplate);
    done();
  });

  afterEach(async (done) => {
    await tokenType.destroy();
    done();
  });

  it('returns an instance with correct values', async (done) => {
    expect(typeof transaction).toBe('object');
    expect(transaction.tokentype_uuid).toBe(tokenType.uuid);
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

  it ('creates an association with the TokenType model', async (done) => {
    const transactionWithTokenType =
      await Transaction.findById(transaction.uuid, {
        include: [{ model: TokenType }]});
    const retrievedTokenType = transactionWithTokenType['TokenType'];
    const transactionValues = transactionWithTokenType['dataValues'];
    const tokenTypeValues = retrievedTokenType.dataValues;
    expect (transactionValues.tokentype_uuid).toBe(tokenTypeValues.uuid);
    done();
  });
});
