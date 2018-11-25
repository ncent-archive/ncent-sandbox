const StellarSdk = require('stellar-sdk');
const challenges = require('../../../server/controllers').challenges;
const db = require('../../../server/models');
const Challenge = db.Challenge;
const TokenType = db.TokenType;
const Transaction = db.Transaction;
const Wallet = db.Wallet;
//make sure to pass this environment variable in the command line when running this test
const TOKEN_GRAVEYARD_ADDRESS = process.env.TOKEN_GRAVEYARD_ADDRESS;

describe('challenges Controller', () => {
    let challenge;
    let tokenType;
    let transaction;
    let challengeBody;
    let challengeParams;
    let sponsorWallet;
    const keypair1 = StellarSdk.Keypair.random();

    let tokenTypeTemplate;

    beforeEach(async (done) => {
        const challengeReceiver = async (res) => {
            challenge = res['challenge'];
            transaction = res['transaction'];
            done();
        };

        tokenTypeTemplate = {
            name: 'tokenName',
            expiryDate: '2020',
            sponsorUuid: keypair1.publicKey(),
            totalTokens: 10000,
        };

        tokenType = await TokenType.create(tokenTypeTemplate);

        challengeParams = { address: keypair1.publicKey() };

        sponsorWallet = await Wallet.create({address: keypair1.publicKey()});

        challengeBody = {
            rewardAmount: 1000,
            name: "challengeName",
            description: "challengeDescription",
            company: "nCent",
            imageUrl: "http://www.google.com",
            participationUrl: "http://ncent.io",
            expiration: Date.now() + 100,
            tokenTypeUuid: tokenType.uuid,
            rewardType: "NCNT",
            maxShares: 100,
            maxRedemptions: 5
        };

        challengeBody.signed = signObject(challengeBody, keypair1._secretKey);

        await challenges.create({
            body: challengeBody,
            params: challengeParams
        }, new psuedoRes(challengeReceiver));
    });

    afterEach(async (done) => {
        await TokenType.destroy({where: {}});
        await Challenge.destroy({where: {}});
        await Transaction.destroy({where: {}});
        await Wallet.destroy({where: {}});
        done();
    });

    describe('create', () => {
        it('returns a challenge with correct properties', () => {
            expect(typeof challenge).toBe('object');
            expect(typeof challenge.uuid).toBe('string');
            expect(challenge.name).toBe(challengeBody.name);
            expect(challenge.description).toBe(challengeBody.description);
            expect(challenge.company).toBe(challengeBody.company);
            expect(challenge.imageUrl).toBe(challengeBody.imageUrl);
            expect(challenge.participationUrl).toBe(challengeBody.participationUrl);
            expect(challenge.expiration.getTime()).toBe(
                new Date(challengeBody.expiration).getTime()
            );
            expect(challenge.rewardAmount).toBe(challengeBody.rewardAmount);
            expect(challenge.rewardType).toBe(challengeBody.rewardType);
            expect(challenge.sponsorWalletAddress).toBe(challengeParams.address);
            expect(challenge.maxShares).toBe(challengeBody.maxShares);
            expect(challenge.maxRedemptions).toBe(challengeBody.maxRedemptions);
            expect(challenge.isComplete).toBe(false);
        });

        it('returns a transaction from the Token graveyard to the sponsor', () => {
            expect(typeof transaction).toBe('object');
            expect(transaction.fromAddress).toBe(TOKEN_GRAVEYARD_ADDRESS);
            expect(transaction.toAddress).toBe(challengeParams.address);
            expect(transaction.numShares).toBe(challengeBody.maxShares);
        });

        it('persists a created Challenge to the database', async (done) => {
            const retrievedChallenge = await Challenge.findById(challenge.uuid);
            expect(retrievedChallenge).not.toBe(undefined);
            done();
        });

        it('persists a created transaction to the database', async (done) => {
            const retrievedTransaction = await Transaction.findById(transaction.uuid);
            expect(retrievedTransaction).not.toBe(undefined);
            done();
        });
    });
});
