const StellarSdk = require("stellar-sdk");
const wallets = require("../../../server/controllers").wallets;
const db = require("../../../server/models");
const { TokenType, Wallet, Transaction } = db;

describe('wallet retrieveBalance', () => {
  const INITIAL_WALLET_AMOUNT = 10000;
  const AMOUNT = 1000;
  let tokenType;
  let walletOwnerKeypair;
  let endTransaction;
  let receiverKeypair1;
  let receiverKeypair2;

  beforeEach(async (done) => {
    walletOwnerKeypair = StellarSdk.Keypair.random();
    tokenType = await TokenType.create({
      name: 'tokenName',
      expiryDate: '2020',
      sponsorUuid: walletOwnerKeypair.publicKey(),
      totalTokens: INITIAL_WALLET_AMOUNT,
    });
    await Wallet.create({ address: walletOwnerKeypair.publicKey() });
    const tHandler = originTransaction => {
      shareTransaction(walletOwnerKeypair, originTransaction.uuid, handleShare1);
    }
    createOriginTransaction(walletOwnerKeypair, tokenType.uuid, AMOUNT, tHandler);
    const handleShare1 = sharedTransaction => {
      receiverKeypair1 = sharedTransaction.receiverKeypair;
      const transaction2 = sharedTransaction.transaction.transaction;
      shareTransaction(receiverKeypair1, transaction2.uuid, handleShare2);
    };
    const handleShare2 = async sharedTransaction => {
      receiverKeypair2 = sharedTransaction.receiverKeypair;
      endTransaction = sharedTransaction.transaction.transaction;
      done();
    }
  });

  afterEach(async (done) => {
    await TokenType.destroy({ where: {} });
    await Wallet.destroy({ where: {} });
    await Transaction.destroy({ where: {} });
    done();
  });


  it('returns the balance of a TokenType owner correctly', async (done) => {
    const balanceHandler = (ret) => {
      expect(ret.balance).toBe(9000);
      done();
    }
    wallets.retrieveBalance({ params: {
      address: walletOwnerKeypair.publicKey(),
      tokenTypeUuid: tokenType.uuid
    }}, new psuedoRes(balanceHandler));
  });
  
  it('returns the balance of a wallet with transactions', async (done) => {    
    const balanceHandler = (ret) => {
      expect(ret.balance).toBe(1000);
      done();
    }
    wallets.retrieveBalance({ params: {
      address: receiverKeypair2.publicKey(),
      tokenTypeUuid: tokenType.uuid
    }}, new psuedoRes(balanceHandler));
  });
});