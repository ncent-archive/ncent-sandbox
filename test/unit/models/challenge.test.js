const db = require('../../../server/models');
const Challenge = db.Challenge;
const TokenType = db.TokenType;
const StellarSdk = require('stellar-sdk');

describe('Challenge Model', () => {
    let challenge;
    let tokenType;
    let challengeTemplate;
    let tokenTypeTemplate;

    beforeEach(async (done) => {
        const keypair1 = StellarSdk.Keypair.random();

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
        done();
    });

    afterEach(async (done) => {
        await Challenge.destroy({where: {}});
        await TokenType.destroy({where: {}});
        done();
    });

    it('returns an instance with correct values', async (done) => {
        expect(typeof challenge).toBe('object');
        expect(typeof challenge.uuid).toBe('string');
        expect(challenge.name).toBe(challengeTemplate.name);
        expect(challenge.description).toBe(challengeTemplate.description);
        expect(challenge.company).toBe(challengeTemplate.company);
        expect(challenge.imageUrl).toBe(challengeTemplate.imageUrl);
        expect(challenge.participationUrl).toBe(challengeTemplate.participationUrl);
        expect(challenge.expiration.getTime()).toBe(
            new Date(challengeTemplate.expiration).getTime()
        );
        expect(challenge.rewardAmount).toBe(challengeTemplate.rewardAmount);
        expect(challenge.rewardType).toBe(challengeTemplate.rewardType);
        expect(challenge.sponsorWalletAddress).toBe(challengeTemplate.sponsorWalletAddress);
        expect(challenge.maxShares).toBe(challengeTemplate.maxShares);
        expect(challenge.maxRedemptions).toBe(challengeTemplate.maxRedemptions);
        expect(challenge.isComplete).toBe(challengeTemplate.isComplete);
        done();
    });

    it ('persists the created challenge', async (done) => {
        const retrievedChallenge = await Challenge.findById(challenge.uuid);
        expect(retrievedChallenge).not.toBe(undefined);
        done();
    });
});