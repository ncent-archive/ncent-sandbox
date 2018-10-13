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

  beforeEach(async (done) => {
    walletOwnerKeypair = StellarSdk.Keypair.random();
    tokenType = await TokenType.create({
      name: 'tokenName',
      expiryDate: '2020',
      sponsorUuid: walletOwnerKeypair.publicKey(),
      totalTokens: 10000,
    });
    wallet = await Wallet.create({ address: walletOwnerKeypair.publicKey()});
    const tHandler = (transactionObject) => {
      transaction = transactionObject;
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
  
  describe('list', () => {
    it('returns all transactions', async (done) => {
      const tests = (res) => {
        const trans = res[0];
        expect(trans.uuid).toBe(transaction.uuid);
        done();
      };
      await transactions.list({}, new psuedoRes(tests));
    })
  });

  describe('create', () => {
    it('returns a "challenge" transaction', () => {
      expect(transaction).not.toBe(undefined);
      expect(typeof transaction.uuid).toBe('string');
      expect(transaction.amount).toBe(AMOUNT);
      expect(transaction.fromAddress).toBe(walletOwnerKeypair.publicKey());
      expect(transaction.toAddress).toBe(walletOwnerKeypair.publicKey());
    });

    it('persists a created transaction to the database', async (done) => {
      const retrievedTransaction = await Transaction.findById(transaction.uuid);
      expect(retrievedTransaction).not.toBe(undefined);
      done();
    });
    
    it('does not create a transaction for a non-owner', async (done) => {
      const nefariousKeypair = StellarSdk.Keypair.random();
      const tHandler = (transactionObject) => {
        expect(transactionObject.message).not.toBe(undefined); //message === err
        done();
      };
      const nefariousWallet = await Wallet.create({
        address: nefariousKeypair.publicKey()
      });
      createOriginTransaction(nefariousKeypair, tokenType.uuid, AMOUNT, tHandler);
    });
    
    it('does not create a transaction with amount > wallet amount', async (done) => {
      const tHandler = (transactionObject) => {
        expect(transactionObject.message).toBe('Inadequate wallet balance');
        done();
      };
      createOriginTransaction(
        walletOwnerKeypair, tokenType.uuid, INITIAL_WALLET_AMOUNT+1, tHandler
      );
    });
  });

  
  describe('share', () => {
    let receiverKeypair;
    beforeEach(async (done) => {
      const handleShare = (sharedTransaction) => {
        receiverKeypair = sharedTransaction.receiverKeypair;
        done();
      };
      shareTransaction(walletOwnerKeypair, transaction.uuid, handleShare);
    });
  
    afterEach(async (done) => {
      await Transaction.destroy({ where: {} });
      await Wallet.destroy({ where: {} });
      done();
    });

    it ('only allows for sharing of owned transactions', async (done) => {
      const handleShare = sharedTransaction => {
        const msg = sharedTransaction.transaction.message;
        expect(msg).toBe("Transaction was transferred already");
        done();
      };
      shareTransaction(walletOwnerKeypair, transaction.uuid, handleShare);
    });
  });


  describe('provenanceChain', () => {
    it('returns an accurate provenance chain', async (done) => {
      let receiverKeypair1;
      let receiverKeypair2;
      const handleShare1 = async sharedTransaction => {
        receiverKeypair1 = sharedTransaction.receiverKeypair;
        const transaction2 = sharedTransaction.transaction.transaction;
        shareTransaction(receiverKeypair1, transaction2.uuid, handleShare2);
      };
      const handleShare2 = async sharedTransaction => {
        receiverKeypair2 = sharedTransaction.receiverKeypair;
        const transaction3 = sharedTransaction.transaction.transaction;
        await transactions.provenanceChain({
            params: { transactionUuid: transaction3.uuid}
          }, new psuedoRes(handleProvenanceChain)
        );
      };
      const handleProvenanceChain = (provenanceChain) => {
        const firstTransaction = provenanceChain[0];
        const secondTransaction = provenanceChain[1];
        const thirdTransaction = provenanceChain[2];
        expect(provenanceChain.length).toBe(3);
        expect(firstTransaction.fromAddress).toBe(firstTransaction.toAddress);
        expect(firstTransaction.amount).toBe(secondTransaction.amount);
        expect(firstTransaction.amount).toBe(thirdTransaction.amount);
        done();
      };
      shareTransaction(walletOwnerKeypair, transaction.uuid, handleShare1);
    });
  });

  describe('provenanceChainFIFO', () => {
    it('returns an accurate provenance chain', async (done) => {
      let receiverKeypair1;
      let receiverKeypair2;
      const handleShare1 = async sharedTransaction => {
        receiverKeypair1 = sharedTransaction.receiverKeypair;
        const transaction2 = sharedTransaction.transaction.transaction;
        shareTransaction(receiverKeypair1, transaction2.uuid, handleShare2);
      };
      const handleShare2 = async sharedTransaction => {
        receiverKeypair2 = sharedTransaction.receiverKeypair;
        await transactions.provenanceChainFIFO({
          params: {
            address: receiverKeypair2.publicKey(),
            tokenTypeUuid: tokenType.uuid
          }
        }, new psuedoRes(handleProvenanceChain)
        );
      };
      const handleProvenanceChain = (provenanceChain) => {
        const firstTransaction = provenanceChain[0];
        const secondTransaction = provenanceChain[1];
        const thirdTransaction = provenanceChain[2];
        expect(provenanceChain.length).toBe(3);
        expect(firstTransaction.fromAddress).toBe(firstTransaction.toAddress);
        expect(firstTransaction.amount).toBe(secondTransaction.amount);
        expect(firstTransaction.amount).toBe(thirdTransaction.amount);
        done();
      };
      shareTransaction(walletOwnerKeypair, transaction.uuid, handleShare1);
    });

    it('throws an error when given an invalid tokenUuid', async (done) => {
      const tests = (res) => {
        expect(res.message).not.toBe(undefined);
        done();
      };
      await transactions.provenanceChainFIFO({
        params: {
          address: walletOwnerKeypair.publicKey(),
          tokenTypeUuid: '44444444-4444-4444-4444-444444444444'
        }
      }, new psuedoRes(tests));
    });

    it('throws an error when given an invalid address', async (done) => {
      const tests = (res) => {
        expect(res.message).not.toBe(undefined);
        done();
      };
      await transactions.provenanceChainFIFO({
        params: {
          address: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          tokenTypeUuid: tokenType.uuid
        }
      }, new psuedoRes(tests));
    });
  });
});
