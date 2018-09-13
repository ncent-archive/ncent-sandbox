const StellarSdk = require('stellar-sdk');
const transactions = require('../../../server/controllers').transactions;
const db = require('../../../server/models')
const TokenType = db.TokenType;
const Wallet = db.Wallet;
const Transaction = db.Transaction;

describe('transactions Controller', () => {
  let tokenType;
  let walletOwnerKeypair;
  let wallet;

  beforeEach(async (done) => {
    walletOwnerKeypair = StellarSdk.Keypair.random();
    tokenType = await TokenType.create({
      Name: 'tokenName',
      ExpiryDate: '2020',
      sponsor_uuid: walletOwnerKeypair.publicKey(),
      totalTokens: 10000,
    });
    wallet = await Wallet.create({
      wallet_uuid: walletOwnerKeypair.publicKey(),
      tokentype_uuid: tokenType.uuid,
      balance: 10000,
    });
    done();
  });

  afterEach(async (done) => {
    await TokenType.destroy({where: {}});
    await Wallet.destroy({where: {}});
    done();
  });

  describe('create', () => {
    let transaction;
    const AMOUNT = 1000;
    let receiverKeypair;

    beforeEach(async (done) => {
      receiverKeypair = StellarSdk.Keypair.random();
      const senderPrivate = walletOwnerKeypair._secretKey;
      const messageObj = {
        fromAddress: walletOwnerKeypair.publicKey(),
        toAddress: receiverKeypair.publicKey(),
        amount: AMOUNT
      };
      const signed = signObject(messageObj, senderPrivate);
      messageObj.signed = signed;
      const localStoreResolve = (res) => {
        transaction = res;
        done();
      }
      await transactions.create({
        body: messageObj,
        params: {tokentype_uuid: tokenType.uuid}
      }, new psuedoRes(localStoreResolve));
    });

    afterEach(async (done) => {
      await Transaction.destroy({where: {}});
      done();
    });

    it('returns a transaction with correct properties', () => {
      const transactionObject = transaction.txn;

      expect(transaction).not.toBe(undefined);
      expect(typeof transactionObject.uuid).toBe('string');
      expect(transactionObject.amount).toBe(AMOUNT);
      expect(transactionObject.fromAddress).toBe(walletOwnerKeypair.publicKey());
      expect(transactionObject.toAddress).toBe(receiverKeypair.publicKey());
    });

    it('persists a created transaction to the database', async (done) => {
      const txn = await Transaction.findById(transaction.txn.uuid);
      expect(txn).not.toBe(undefined);
      done();
    });

    // it ('modifies wallet......TODO', async (done) => {
    //
    //   done();
    // })
  });

  // describe('list', () => {
  //
  // });
});
