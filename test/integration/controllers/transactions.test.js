const StellarSdk = require('stellar-sdk');
const transactions = require('../../../server/controllers').transactions;
const db = require('../../../server/models');
const { TokenType, Wallet, Transaction } = db;

describe('Provenance and Redemption', () => {
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
      const transaction2 = sharedTransaction.transaction.txn;
      shareTransaction(receiverKeypair1, transaction2.uuid, handleShare2);
    };
    const handleShare2 = async sharedTransaction => {
      receiverKeypair2 = sharedTransaction.receiverKeypair;
      endTransaction = sharedTransaction.transaction.txn;
      done();
    }
  });

  afterEach(async (done) => {
    await TokenType.destroy({ where: {} });
    await Wallet.destroy({ where: {} });
    await Transaction.destroy({ where: {} });
    done();
  });

  it('returns an accurate provenance chain', async (done) => {
    const handleProvenanceChain = (provenanceChain) => {
      const firstTransaction = provenanceChain[0];
      const secondTransaction = provenanceChain[1];
      const thirdTransaction = provenanceChain[2];
      expect(provenanceChain.length).toBe(3);
      expect(firstTransaction.fromAddress).toBe(firstTransaction.toAddress);
      expect(firstTransaction.amount).toBe(secondTransaction.amount);
      expect(firstTransaction.amount).toBe(thirdTransaction.amount);
      expect(thirdTransaction.uuid).toBe(endTransaction.uuid);
      done();
    };
    const handleShare = (latestSharedTransaction) => {
      transactions.provenanceChain({
          params: { transactionUuid: endTransaction.uuid }
        }, new psuedoRes(handleProvenanceChain)
      );
    }
    const tHandler = originTransaction => {
      shareTransactionWithKeypair(
        walletOwnerKeypair, receiverKeypair2, originTransaction.uuid, handleShare
      );
    };
    createOriginTransaction(walletOwnerKeypair, tokenType.uuid, AMOUNT, tHandler);
  });

  it('redeem and provenanceChainFIFO', async (done) => {
    let firstProvenanceChain;
    const messageObject = {
      transactionUuid: endTransaction.uuid
    };
    const signed = signObject(messageObject, walletOwnerKeypair._secretKey);
    messageObject.signed = signed;

    const tHandler = originTransaction => {
      shareTransactionWithKeypair(
        walletOwnerKeypair, receiverKeypair2, originTransaction.uuid, handleShare
      );
    };
    createOriginTransaction(walletOwnerKeypair, tokenType.uuid, AMOUNT, tHandler);
    const handleShare = (latestSharedTransaction) => {
      transactions.provenanceChainFIFO({
          params: { address: receiverKeypair2.publicKey(), tokenTypeUuid: tokenType.uuid }
        }, new psuedoRes(handleProvenanceChain)
      );
    }
    const handleProvenanceChain = (provenanceChain) => {
      firstProvenanceChain = provenanceChain;
      transactions.redeem({
        body: messageObject
      }, new psuedoRes(handleRedemption)
      );
    };
    const handleRedemption = (redeemReturn) => {
      transactions.provenanceChainFIFO({
        params: { address: receiverKeypair2.publicKey(), tokenTypeUuid: tokenType.uuid }
      }, new psuedoRes(handleProvenanceChain2)
      );
    };
    const handleProvenanceChain2 = (provenanceChain) => {
      const firstTransactionInChain1 = firstProvenanceChain[0];
      const firstTransactionInChain2 = provenanceChain[0];
      expect(firstTransactionInChain1.uuid).not.toBe(firstTransactionInChain2.uuid);
      done();
    };
  });

});