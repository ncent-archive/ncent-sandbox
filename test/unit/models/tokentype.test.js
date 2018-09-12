const TokenType = require('../../../server/models').TokenType;
const StellarSdk = require('stellar-sdk');

describe('TokenType', () => {
  let tokenType;
  beforeEach(async (done) => {
    const keypair = StellarSdk.Keypair.random();
    const tokenTypeTemplate = {
      Name: 'testTokenName',
      ExpiryDate: '2020',
      sponsor_uuid: keypair.publicKey(),
      totalTokens: 10000,
    };
    tokenType = await TokenType.create(tokenTypeTemplate);
    done();
  });

  afterEach(async (done) => {
    await tokenType.destroy();
    done();
  })

  it('successfully returns an instance', async (done) => {
    expect(typeof tokenType).toBe('object');
    done();
  });
});
