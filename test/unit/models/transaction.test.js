const db = require('../../../server/models')
const TokenType = db.TokenType;
const Transaction = db.Transaction;
const StellarSdk = require('stellar-sdk');

describe('Transaction Model', () => {
  let tokenType;
  let transaction;
  const keypair1 = Object.freeze(StellarSdk.Keypair.random());
  const keypair2 = Object.freeze(StellarSdk.Keypair.random());
  const tokenTypeTemplate = Object.freeze({
    Name: 'TokenName',
    ExpiryDate: '2020',
    sponsor_uuid: keypair1.publicKey(),
    totalTokens: 10000,
  });
  const transactionDetails = Object.freeze({
    tokentype_uuid: '',
    amount: Math.floor(Math.random() * 1000) + 1,
    fromAddress: keypair1.publicKey(),
    toAddress: keypair2.publicKey(),
  });

  beforeEach(async (done) => {
    tokenType = await TokenType.create(tokenTypeTemplate);
    const transactionTemplate =
      Object.assign({}, transactionDetails, {tokentype_uuid: tokenType.uuid});
    transaction = await Transaction.create(transactionTemplate);
    done();
  });

  afterEach(async (done) => {
    await tokenType.destroy();
    await transaction.destroy();
    done();
  });

  it('returns an instance with correct values', async (done) => {
    expect(typeof transaction).toBe('object');
    expect(transaction.tokentype_uuid).toBe(tokenType.uuid);
    expect(typeof transaction.uuid).toBe('string');
    expect(transaction.amount).toBe(transactionDetails.amount);
    expect(transaction.fromAddress).toBe(transactionDetails.fromAddress);
    expect(transaction.toAddress).toBe(transactionDetails.toAddress);
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
