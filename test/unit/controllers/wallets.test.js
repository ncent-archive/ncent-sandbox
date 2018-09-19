const StellarSdk = require('stellar-sdk');
const wallets = require('../../../server/controllers').wallets;
const db = require('../../../server/models')
const Wallet = db.Wallet;

describe('wallets Controller', () => {
  let wallet1;
  let wallet2;
  beforeEach(async (done) => {
    const keypair1 = StellarSdk.Keypair.random();
    const keypair2 = StellarSdk.Keypair.random();
    wallet1 = await Wallet.create({ address: keypair1.publicKey() });
    wallet2 = await Wallet.create({ address: keypair2.publicKey() });
    done();
  });

  afterEach(async (done) => {
    await Wallet.destroy({where: {}});
    done();
  });

  describe('listAll', () => {
    it('returns all created wallets', async (done) => {
      const tests = (receivedWallets) => {
        const resWallet1Uuid = receivedWallets[0].uuid;
        const resWallet2Uuid = receivedWallets[1].uuid;
        // order isn't known, so check both for uuid
        const wallet1Retrieved =
          resWallet1Uuid === wallet1.uuid || resWallet2Uuid === wallet1.uuid;
        const wallet2Retrieved =
          resWallet1Uuid === wallet2.uuid || resWallet2Uuid === wallet2.uuid;
        expect(wallet1Retrieved).toBe(true);
        expect(wallet2Retrieved).toBe(true);
        expect(receivedWallets.length).toBe(2);
        done();
      }
      wallets.listAll({}, new psuedoRes(tests));
    })
  });

  describe('retrieve', () => {
    it('returns a wallet with an address matching query', async (done) => {
      const tests = (receivedWallet) => {
        expect(receivedWallet).not.toBe(undefined);
        expect(receivedWallet.uuid).toBe(wallet1.uuid);
        done();
      }
      wallets.retrieve({
          params: { address: wallet1.address }
        }, new psuedoRes(tests)
      );
    })
  });

});
