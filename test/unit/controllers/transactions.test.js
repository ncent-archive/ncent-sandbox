const StellarSdk = require('stellar-sdk');
const transactions = require('../../../server/controllers').transactions;
const db = require('../../../server/models');
const { TokenType, Wallet, Transaction } = db;

describe('transactions Controller', () => {
  const INITIAL_WALLET_AMOUNT = 10000;
  const AMOUNT = 1000;
  let tokenType;
  let walletOwnerKeypair;
  let wallet;
  let transaction;
  let receiverKeypair;

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
      balance: INITIAL_WALLET_AMOUNT,
    });
    const tHandler = (transactionObject) => {
      transaction = transactionObject.transaction;
      receiverKeypair = transactionObject.receiverKeypair;
      done();
    };
    createOriginTransaction(walletOwnerKeypair, tokenType.uuid, AMOUNT, tHandler);
  });

  afterEach(async (done) => {
    await TokenType.destroy({where: {}});
    await Wallet.destroy({where: {}});
    await Transaction.destroy({where: {}});
    done();
  });

  describe('create', () => {

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

    it('adds balance to the receiver wallet balance', async (done) => {
      const retrievedReceiverWallet =
        await Wallet.findOne({where: {
          wallet_uuid: receiverKeypair.publicKey()
        }});
      expect(retrievedReceiverWallet.balance).toBe(AMOUNT);
      done();
    });

    it('subtracts balance from sender wallet balance', async (done) => {
      const senderWallet =
        await Wallet.findOne({where: {
          wallet_uuid: walletOwnerKeypair.publicKey()
        }});
      expect(senderWallet.balance).toBe(INITIAL_WALLET_AMOUNT - AMOUNT);
      done();
    });
  });

  describe('list', () => {
    it('returns all transactions', async (done) => {
      const tests = (res) => {
        const trans = res[0];
        expect(trans.uuid).toBe(transaction.txn.uuid);
        done();
      };
      await transactions.list({}, new psuedoRes(tests));
    })
  });

  describe('retrieveProvenanceChain', () => {
    it('returns an accurate provenance chain', async (done) => {
        const tHandler = async (transactionObject) => {
          const newTransaction = transactionObject.transaction.txn;
          const newReceiverKeypair = transactionObject.receiverKeypair;
          const tests = (provenanceChain) => {
            expect(provenanceChain.length).toBe(2);
            const firstTransaction = provenanceChain[0];
            const secondTransaction = provenanceChain[1];
            expect(secondTransaction.uuid).toBe(newTransaction.uuid);
            expect(firstTransaction.amount).toBe(AMOUNT);
            expect(secondTransaction.amount).toBe(AMOUNT);
            expect(firstTransaction.fromAddress).toBe(walletOwnerKeypair.publicKey());
            expect(firstTransaction.toAddress).toBe(receiverKeypair.publicKey());
            expect(secondTransaction.fromAddress).toBe(receiverKeypair.publicKey());
            expect(secondTransaction.toAddress).toBe(newReceiverKeypair.publicKey());
            expect(firstTransaction.tokentype_uuid).toBe(tokenType.uuid);
            expect(secondTransaction.tokentype_uuid).toBe(tokenType.uuid);
            done();
          };
        await transactions.retrieveProvenanceChain({
          params: {
            wallet_uuid: newReceiverKeypair.publicKey(),
            tokentype_uuid: tokenType.uuid
          }
        }, new psuedoRes(tests));
      };
      createChildTransaction(receiverKeypair, transaction.txn.dataValues.uuid, tokenType.uuid, AMOUNT, tHandler);
    });
    it('throws an error when given an invalid token_uuid', async (done) => {
      const tests = (res) => {
        expect(res.message).not.toBe(undefined);
        done();
      };
      await transactions.retrieveProvenanceChain({
        params: {
          wallet_uuid: walletOwnerKeypair.publicKey(),
          tokentype_uuid: '44444444-4444-4444-4444-444444444444'
        }
      }, new psuedoRes(tests));
    });
    it('throws an error when given an invalid wallet_uuid', async (done) => {
      const tests = (res) => {
        expect(res.message).not.toBe(undefined);
        done();
      };
      await transactions.retrieveProvenanceChain({
        params: {
          wallet_uuid: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          tokentype_uuid: tokenType.uuid
        }
      }, new psuedoRes(tests));
    });
  });
});
