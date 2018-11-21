const StellarSdk = require('stellar-sdk');
const tokentypes = require('../../../server/controllers').tokentypes;
const db = require('../../../server/models');
const TokenType = db.TokenType;
const Wallet = db.Wallet;

describe('tokentypes Controller', () => {
    let tokenType;
    let wallet;
    const keypair = StellarSdk.Keypair.random();
    const tokenTypeTemplate = {
        name: 'tokenName',
        expiryDate: '2020',
        sponsorUuid: keypair.publicKey(),
        totalTokens: 10000,
    };

    beforeEach(async (done) => {
        const tokenReceiver = async (res) => {
            tokenType = res['tokenType'];
            wallet = res['wallet'];
            done();
        };

        await tokentypes.create({
            body: tokenTypeTemplate
        }, new psuedoRes(tokenReceiver));
    });

    afterEach(async (done) => {
        await TokenType.destroy({where: {}});
        await Wallet.destroy({where: {}});
        done();
    });

    describe('create', () => {
        it('returns a tokentype with correct properties', () => {
            expect(typeof tokenType).toBe('object');
            expect(tokenType.name).toBe(tokenTypeTemplate.name);
            expect(tokenType.expiryDate.getTime()).toBe(
                new Date(tokenTypeTemplate.expiryDate).getTime()
            );
            expect(typeof tokenType.uuid).toBe('string');
            expect(tokenType.sponsorUuid).toBe(tokenTypeTemplate.sponsorUuid);
            expect(parseInt(tokenType.totalTokens)).toBe(tokenTypeTemplate.totalTokens);
        });

        it('returns a wallet storing given sponsorUuid', () => {
            expect(typeof wallet).toBe('object');
            expect(wallet.address).toBe(tokenTypeTemplate.sponsorUuid);
        });

        it('persists a created TokenType to the database', async (done) => {
            const retrievedToken = await TokenType.findById(tokenType.uuid);
            expect(retrievedToken).not.toBe(undefined);
            done();
        });

        it('persists a created wallet to the database', async (done) => {
            const retrievedWallet = await Wallet.findById(wallet.uuid);
            expect(retrievedWallet).not.toBe(undefined);
            done();
        });
    });

    describe('listAll', () => {
        it('returns all TokenTypes', async (done) => {
            const tests = (receivedTokenTypes) => {
                const receivedTokenType = receivedTokenTypes[0];
                expect(receivedTokenType.uuid).toBe(tokenType.uuid);
                done();
            };
            await tokentypes.listAll({}, new psuedoRes(tests));
        });
    });

    describe('listOne', () => {
        it('returns TokenType of a param type', async (done) => {
            const tests = (receivedTokenType) => {
                expect(receivedTokenType.uuid).toBe(tokenType.uuid);
                done();
            };
            await tokentypes.listOne({
                params: {tokenTypeUuid: tokenType.uuid}
            }, new psuedoRes(tests));
        });

        it('returns TokenType not found if given an invalid uuid', async (done) => {
            const tests = (res) => {
                expect(res.message).toBe("TokenType not found");
                done();
            };
            await tokentypes.listOne({
                params: {tokenTypeUuid: '44444444-4444-4444-4444-444444444444'}
            }, new psuedoRes(tests));
        })
    });

});
