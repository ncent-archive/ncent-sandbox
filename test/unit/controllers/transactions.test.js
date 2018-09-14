const StellarSdk = require('stellar-sdk');
const transactions = require('../../../server/controllers').transactions;
const db = require('../../../server/models')
const TokenType = db.TokenType;
const Wallet = db.Wallet;
const Transaction = db.Transaction;

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
    receiverKeypair = StellarSdk.Keypair.random();
    const senderPrivate = walletOwnerKeypair._secretKey;
    const messageObj = {
      fromAddress: walletOwnerKeypair.publicKey(),
      toAddress: receiverKeypair.publicKey(),
      amount: AMOUNT
    };
    const signed = signObject(messageObj, senderPrivate);
    messageObj.signed = signed;

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
    const localStoreResolve = async (res) => {
      transaction = res;
      done();
    }
    await transactions.create({
      body: messageObj,
      params: {tokentype_uuid: tokenType.uuid}
    }, new psuedoRes(localStoreResolve));
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
      const tests = (provenanceChain) => {
        console.log(provenanceChain);
        done();
      };
      const receiver2Keypair = StellarSdk.Keypair.random();
      const sender2Private = receiverKeypair._secretKey;
      const messageObj = {
        fromAddress: receiverKeypair.publicKey(),
        toAddress: receiver2Keypair.publicKey(),
        amount: AMOUNT
      };
      const signed = signObject(messageObj, sender2Private);
      let newestTransaction;
      messageObj.signed = signed;
      await transactions.create(
        {
          body: messageObj,
          params: { tokentype_uuid: tokenType.uuid }
        },
          new psuedoRes(async (res) => {
            newestTransaction = res;
            await transactions.retrieveProvenanceChain({
              body: {
                wallet_uuid: receiver2Keypair.publicKey()
              },
              params: {
                tokentype_uuid: tokenType.uuid
              }
            }, new psuedoRes(tests));
          }
      ));
    });
  });

});
