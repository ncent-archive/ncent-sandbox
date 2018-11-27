const StellarSdk = require('stellar-sdk');
const transactions = require('../../../server/controllers').transactions;
const db = require('../../../server/models');
const {TokenType, Wallet, Transaction, Challenge} = db;
const TOKEN_GRAVEYARD_ADDRESS = process.env.TOKEN_GRAVEYARD_ADDRESS;

describe('transactions Controller', () => {
    const INITIAL_WALLET_AMOUNT = 10000;
    const AMOUNT = 1000;
    let tokenType;
    let walletOwnerKeypair;
    let wallet;
    let transaction;
    let challenge;
    let challengeTemplate;

    beforeEach(async (done) => {
        walletOwnerKeypair = StellarSdk.Keypair.random();
        tokenType = await TokenType.create({
            name: 'tokenName',
            expiryDate: '2020',
            sponsorUuid: walletOwnerKeypair.publicKey(),
            totalTokens: INITIAL_WALLET_AMOUNT,
        });
        wallet = await Wallet.create({address: walletOwnerKeypair.publicKey()});
        challengeTemplate = {
            name: "challengeName",
            description: "challengeDescription",
            company: "nCent",
            imageUrl: "http://www.google.com",
            participationUrl: "http://ncent.io",
            expiration: "2020",
            rewardAmount: 1000,
            rewardType: "NCNT",
            sponsorWalletAddress: walletOwnerKeypair.publicKey(),
            maxShares: AMOUNT,
            maxRedemptions: 5,
            isComplete: false,
            tokenTypeUuid: tokenType.uuid
        };
        challenge = await Challenge.create(challengeTemplate);
        const tHandler = (transactionObject) => {
            transaction = transactionObject;
            done();
        };
        await createOriginTransaction(walletOwnerKeypair, challenge.uuid, AMOUNT, tHandler);
    });

    afterEach(async (done) => {
        await TokenType.destroy({where: {}});
        await Wallet.destroy({where: {}});
        await Transaction.destroy({where: {}});
        await Challenge.destroy({where: {}});
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
            expect(transaction.numShares).toBe(AMOUNT);
            expect(transaction.fromAddress).toBe(TOKEN_GRAVEYARD_ADDRESS);
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
    });


    describe('share', () => {
        afterEach(async (done) => {
            await Transaction.destroy({where: {}});
            await Wallet.destroy({where: {}});
            await Challenge.destroy({where: {}});
            done();
        });

        it('does not create a transaction with amount > wallet amount', async (done) => {
            const tHandler = (transactionObject) => {
                expect(transactionObject.transaction.message).toBe('not enough tokens to send');
                done();
            };
            shareTransaction(
                walletOwnerKeypair, AMOUNT + 1, challenge.uuid, tHandler
            );
        });
    });


    describe('provenanceChain', () => {
        it('returns an accurate provenance chain', async (done) => {
            let receiverKeypair1;
            let receiverKeypair2;
            const handleShare1 = async sharedTransaction => {
                receiverKeypair1 = sharedTransaction.receiverKeypair;
                const transaction2 = sharedTransaction.transaction.transaction;
                await shareTransaction(receiverKeypair1, AMOUNT/4, challenge.uuid, handleShare2);
            };
            const handleShare2 = async sharedTransaction => {
                receiverKeypair2 = sharedTransaction.receiverKeypair;
                const transaction3 = sharedTransaction.transaction.transaction;
                await transactions.provenanceChain({
                        params: {transactionUuid: transaction3.uuid}
                    }, new psuedoRes(handleProvenanceChain)
                );
            };
            const handleProvenanceChain = (provenanceChain) => {
                const firstTransaction = provenanceChain[0];
                const secondTransaction = provenanceChain[1];
                const thirdTransaction = provenanceChain[2];
                expect(provenanceChain.length).toBe(3);
                expect(firstTransaction.fromAddress).toBe(TOKEN_GRAVEYARD_ADDRESS);
                done();
            };
            shareTransaction(walletOwnerKeypair, AMOUNT/2, challenge.uuid, handleShare1);
        });
    });

    describe('provenanceChainFIFO', () => {
        it('returns an accurate provenance chain', async (done) => {
            let receiverKeypair1;
            let receiverKeypair2;
            const handleShare1 = async sharedTransaction => {
                receiverKeypair1 = sharedTransaction.receiverKeypair;
                const transaction2 = sharedTransaction.transaction.transaction;
                await shareTransaction(receiverKeypair1, AMOUNT/4, challenge.uuid, handleShare2);
            };
            const handleShare2 = async sharedTransaction => {
                receiverKeypair2 = sharedTransaction.receiverKeypair;
                await transactions.provenanceChainFIFO({
                        params: {
                            address: receiverKeypair2.publicKey(),
                            challengeUuid: challenge.uuid
                        }
                    }, new psuedoRes(handleProvenanceChain)
                );
            };
            const handleProvenanceChain = (provenanceChain) => {
                const firstTransaction = provenanceChain[0];
                const secondTransaction = provenanceChain[1];
                const thirdTransaction = provenanceChain[2];
                expect(provenanceChain.length).toBe(3);
                expect(firstTransaction.fromAddress).toBe(TOKEN_GRAVEYARD_ADDRESS);
                done();
            };
            shareTransaction(walletOwnerKeypair, AMOUNT/2, challenge.uuid, handleShare1);
        });

        it('throws an error when given an invalid challengeUuid', async (done) => {
            const tests = (res) => {
                expect(res.message).not.toBe(undefined);
                done();
            };
            await transactions.provenanceChainFIFO({
                params: {
                    address: walletOwnerKeypair.publicKey(),
                    challengeUuid: '44444444-4444-4444-4444-444444444444'
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
                    challengeUuid: challenge.uuid
                }
            }, new psuedoRes(tests));
        });
    });

    describe('redeem', () => {
        it('throws an error when given an invalid challengeUuid', async (done) => {
            const tests = (res) => {
                expect(res.message).toBe("Challenge not found");
                done();
            };
            await transactions.redeem({
                body: {
                    address: walletOwnerKeypair.publicKey(),
                    challengeUuid: '44444444-4444-4444-4444-444444444444'
                }
            }, new psuedoRes(tests));
        });

        it('throws an error when trying to redeem a challenge that was already finished', async (done) => {
            const tests = (res) => {
                expect(res.message).toBe("Challenge has already been completed");
                done();
            };
            await challenge.updateAttributes({isComplete: true});
            await transactions.redeem({
                body: {
                    address: walletOwnerKeypair.publicKey(),
                    challengeUuid: challenge.uuid
                }
            }, new psuedoRes(tests));
        });

        it("throws an error when trying to redeem a wallet that doesn't exists", async (done) => {
            const tests = (res) => {
                expect(res.message).toBe("redeemer wallet not found");
                done();
            };
            await transactions.redeem({
                body: {
                    challengeUuid: challenge.uuid
                }
            }, new psuedoRes(tests));
        });

        it("throws an error when trying to redeem a wallet that has no tokens", async (done) => {
            const tests = (res) => {
                expect(res.message).toBe("not enough shares left for redemption");
                done();
            };

            let receiverKeypair1;
            let receiverKeypair2;

            const handleShare1 = async sharedTransaction => {
                receiverKeypair1 = sharedTransaction.receiverKeypair;
                const transaction2 = sharedTransaction.transaction.transaction;
                await shareTransaction(receiverKeypair1, AMOUNT/2, challenge.uuid, handleShare2);
            };

            const handleShare2 = async sharedTransaction => {
                receiverKeypair2 = sharedTransaction.receiverKeypair;

                const ownerPrivateKey = walletOwnerKeypair._secretKey;
                const messageObj = {challengeUuid: challenge.uuid, redeemerAddress: receiverKeypair1.publicKey()};
                messageObj.signed = signObject(messageObj, ownerPrivateKey);

                await transactions.redeem({
                    body: messageObj
                }, new psuedoRes(tests));
            };

            await shareTransaction(walletOwnerKeypair, AMOUNT/2, challenge.uuid, handleShare1);
        });

        it("returns a redemption transaction to the tokengraveyard", async (done) => {
            const tests = (res) => {
                expect(res.redeemTransaction).not.toBe(undefined);
                expect(res.redeemTransaction.toAddress).toBe(TOKEN_GRAVEYARD_ADDRESS);
                done();
            };

            let receiverKeypair1;
            let receiverKeypair2;

            const handleShare1 = async sharedTransaction => {
                receiverKeypair1 = sharedTransaction.receiverKeypair;
                const transaction2 = sharedTransaction.transaction.transaction;
                await shareTransaction(receiverKeypair1, AMOUNT/2, challenge.uuid, handleShare2);
            };

            const handleShare2 = async sharedTransaction => {
                receiverKeypair2 = sharedTransaction.receiverKeypair;

                const ownerPrivateKey = walletOwnerKeypair._secretKey;
                const messageObj = {challengeUuid: challenge.uuid, redeemerAddress: receiverKeypair2.publicKey()};
                messageObj.signed = signObject(messageObj, ownerPrivateKey);

                await transactions.redeem({
                    body: messageObj
                }, new psuedoRes(tests));
            };

            await shareTransaction(walletOwnerKeypair, AMOUNT/2, challenge.uuid, handleShare1);
        });
    });
});
