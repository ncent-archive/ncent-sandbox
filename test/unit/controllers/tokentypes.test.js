const StellarSdk = require('stellar-sdk');
const tokentypes = require('../../../server/controllers').tokentypes;
const db = require('../../../server/models')
const TokenType = db.TokenType;
const Wallet = db.Wallet;

describe('tokentypes Controller', () => {
  let tokenType;
  let wallet;
  const keypair = StellarSdk.Keypair.random();
  const tokenTypeTemplate = {
    Name: 'tokenName',
    ExpiryDate: '2020',
    sponsor_uuid: keypair.publicKey(),
    totalTokens: 10000,
  };

  beforeEach(async (done) => {
    const tokenReceiver = async (res) => {
      tokenType = res['token'];
      wallet = res['wallet'];
      done();
    }
    await tokentypes.create({
      body: tokenTypeTemplate
    }, new psuedoRes(tokenReceiver));
  });

  afterEach(async (done) => {
    await TokenType.destroy({where: {}});
    await Wallet.destroy({where: {}});
    done();
  });

  describe('create', () => {
    it('returns a tokentype with correct properties', () => {
      expect(typeof tokenType).toBe('object');
      expect(tokenType.Name).toBe(tokenTypeTemplate.Name);
      expect(tokenType.ExpiryDate.getTime()).toBe(
        new Date(tokenTypeTemplate.ExpiryDate).getTime()
      );
      expect(typeof tokenType.uuid).toBe('string');
      expect(tokenType.sponsor_uuid).toBe(tokenTypeTemplate.sponsor_uuid);
      expect(tokenType.totalTokens).toBe(tokenTypeTemplate.totalTokens);
    });

    it('returns a wallet with all tokens of tokentype', () => {
      expect(typeof wallet).toBe('object');
      expect(wallet.balance).toBe(tokenTypeTemplate.totalTokens);
      expect(wallet.wallet_uuid).toBe(keypair.publicKey());
      expect(wallet.tokentype_uuid).toBe(tokenType.uuid);
    });

    it('persists a created tokentype to the database', async (done) => {
      const retrievedToken = await TokenType.findById(tokenType.uuid);
      expect(retrievedToken).not.toBe(undefined);
      done();
    });

    it('persists a created wallet to the database', async (done) => {
      const retrievedWallet = await Wallet.findById(wallet.uuid);
      expect(retrievedWallet).not.toBe(undefined);
      done();
    });
  });

  describe('list', () => {
    it('returns all tokentypes', async (done) => {
      const tests = (res) => {
        const tokentype = res[0];
        expect(tokentype.uuid).toBe(tokentype.uuid);
        done();
      };
      await tokentypes.list({}, new psuedoRes(tests));
    });
  });

  describe('retrieve', () => {
    it('returns tokentype of a param type', async (done) => {
      const tests = (res) => {
        const tokentype = res;
        expect(tokentype.uuid).toBe(tokentype.uuid);
        done();
      };
      await tokentypes.retrieve({
        params: {
          tokentype_uuid: tokenType.uuid
        }
      }, new psuedoRes(tests));
    });
    it ('returns TokenType not found if given an invalid uuid', async (done) => {
      const tests = (res) => {
        expect(res.message).toBe("TokenType Not Found");
        done();
      };
      await tokentypes.retrieve({
        params: {
          tokentype_uuid: '44444444-4444-4444-4444-444444444444'
        }
      }, new psuedoRes(tests));
    })
  });

});
