const db = require('../../../server/models')
const TokenType = db.TokenType;
const Transaction = db.Transaction;
const Challenge = db.Challenge;
const StellarSdk = require('stellar-sdk');

describe('Transaction Model', async () => {
    let tokenType;
    let transaction;
    let challenge;
    let tokenTypeTemplate;
    let transactionTemplate;
    let challengeTemplate;

    beforeEach(async (done) => {
        const keypair1 = StellarSdk.Keypair.random();
        const keypair2 = StellarSdk.Keypair.random();
        tokenTypeTemplate = {
            name: 'tokenName',
            expiryDate: '2020',
            sponsorUuid: keypair1.publicKey(),
            totalTokens: 10000,
        };
        tokenType = await TokenType.create(tokenTypeTemplate);

        challengeTemplate = {
            name: "challengeName",
            description: "challengeDescription",
            company: "nCent",
            imageUrl: "http://www.google.com",
            participationUrl: "http://ncent.io",
            expiration: "2020",
            rewardAmount: 1000,
            rewardType: "NCNT",
            sponsorWalletAddress: keypair1.publicKey(),
            maxShares: 100,
            maxRedemptions: 5,
            isComplete: false,
            tokenTypeUuid: tokenType.uuid
        };
        challenge = await Challenge.create(challengeTemplate);

        transactionTemplate = {
            tokenTypeUuid: tokenType.uuid,
            numShares: 1000,
            fromAddress: keypair1.publicKey(),
            toAddress: keypair2.publicKey(),
            challengeUuid: challenge.uuid
        };
        transaction = await Transaction.create(transactionTemplate);
        done();
    });

    afterEach(async (done) => {
        await Transaction.destroy({where: {}});
        await TokenType.destroy({where: {}});
        await Challenge.destroy({where: {}});
        done();
    });

    it('returns an instance with correct values', async (done) => {
        expect(typeof transaction).toBe('object');
        expect(transaction.challengeUuid).toBe(challenge.uuid);
        expect(typeof transaction.uuid).toBe('string');
        expect(transaction.numShares).toBe(transactionTemplate.numShares);
        expect(transaction.fromAddress).toBe(transactionTemplate.fromAddress);
        expect(transaction.toAddress).toBe(transactionTemplate.toAddress);
        done();
    });

    it('persists the created Transaction', async (done) => {
        const retrievedTransaction = await Transaction.findById(transaction.uuid);
        expect(retrievedTransaction).not.toBe(undefined);
        done();
    });
});
