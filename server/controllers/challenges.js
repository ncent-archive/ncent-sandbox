const { Challenge, Transaction, Wallet, TokenType } = require('../models');
const StellarSdk = require("stellar-sdk");
const nacl = require("tweetnacl");
const dec = require("../utils/dec");
const _ = require('lodash');
const TOKEN_GRAVEYARD_ADDRESS = process.env.TOKEN_GRAVEYARD_ADDRESS;

// Receives: publicKey as string, signed transaction, unsigned transaction
// Returns: Boolean: Was this signed by publicKey's secret key
const isVerified = (publicKeyStr, signed, reconstructedObject) => {
    const walletBuffer = StellarSdk.StrKey.decodeEd25519PublicKey(publicKeyStr);
    const decodedObject = dec(JSON.stringify(reconstructedObject));
    return nacl.sign.detached.verify(
        decodedObject,
        Uint8Array.from(JSON.parse(signed)),
        walletBuffer
    );
};

const walletBalance = async (publicKey, challengeUuid) => {
    let balance = 0;
    const toTransactions = await Transaction.findAll({
        where: {toAddress: publicKey, challengeUuid}
    });
    const fromTransactions = await Transaction.findAll({
        where: {fromAddress: publicKey, challengeUuid}
    });
    toTransactions.forEach((transaction) => {
        balance += transaction.numShares;
    });
    fromTransactions.forEach((transaction) => {
        balance -= transaction.numShares;
    });
    return balance;
};

const challengesController = {
    async list(_, res) {
        try {
            const allChallenges = await Challenge.findAll({});
            res.status(200).send(allChallenges);
        } catch(error) { res.status(400).send(error); }
    },
    async retrieve({params}, res) {
        const challenge = await Challenge.findOne({where: {uuid: params.challengeUuid}, include: [{model: Transaction, as: 'transactions'}]});
        res.status(200).send({challenge});
    },
    async create({body, params}, res) {
        let wallet;
        const { name, description, company, imageUrl, participationUrl, expiration, tokenTypeUuid, rewardAmount, rewardType, maxShares, maxRedemptions, signed } = body;
        const sponsorWalletAddress = params.address;

        if (expiration < Date.now()) {
            return res.status(403).send({message: "expiration date not valid"});
        }

        wallet = await Wallet.findOne({ where: { address: sponsorWalletAddress } });
        if (!wallet) {
            wallet = await Wallet.create({ address: sponsorWalletAddress })
        }
        const tokenType = await TokenType.findById(tokenTypeUuid);
        if (!tokenType) {
            return res.status(404).send({ message: "TokenType not found" });
        }
        const challenge = await Challenge.create({
            name,
            description,
            company,
            imageUrl,
            participationUrl,
            expiration,
            tokenTypeUuid,
            rewardAmount,
            rewardType,
            maxShares,
            maxRedemptions,
            sponsorWalletAddress,
            isComplete: false
        });

        const reconstructedObject = { rewardAmount, name, description, company, imageUrl, participationUrl, expiration, tokenTypeUuid, rewardType, maxShares, maxRedemptions };
        if (!isVerified(sponsorWalletAddress, signed, reconstructedObject)) {
            return res.status(403).send({ message: "Invalid transaction signing" });
        }

        const transaction = await Transaction.create({
            fromAddress: TOKEN_GRAVEYARD_ADDRESS,
            toAddress: sponsorWalletAddress,
            numShares: maxShares,
            challengeUuid: challenge.uuid
        });
        res.status(200).send({challenge, transaction});
    },
    async retrieveSponsoredChallenges({params}, res) {
        const sponsoredChallengeBalances = [];
        const sponsoredChallengeRemainingRedemptions = [];
        const sponsorWalletAddress = params.sponsorWalletAddress;
        const wallet = await Wallet.findOne({ where: { address: sponsorWalletAddress } });
        if (!wallet) {
            return res.status(200).send({sponsoredChallenges: [], sponsoredChallengeBalances: [], sponsoredChallengeRemainingRedemptions: []});
        }
        const sponsoredChallenges = await Challenge.findAll({where: {sponsorWalletAddress, isComplete: false}, include: [{model: Transaction, as: 'transactions'}]});

        if (sponsoredChallenges.length > 0) {
            sponsoredChallenges.forEach(async (sponsoredChallenge, index) => {
                const challengeBalance = await walletBalance(sponsorWalletAddress, sponsoredChallenge.uuid);
                sponsoredChallengeBalances.push(challengeBalance);
                const redeemedTransactions = await Transaction.findAll({
                    where: {
                        uuid: sponsoredChallenge.uuid,
                        toAddress: TOKEN_GRAVEYARD_ADDRESS
                    }
                });
                sponsoredChallengeRemainingRedemptions.push(sponsoredChallenge.maxRedemptions - redeemedTransactions.length);
                if (index === sponsoredChallenges.length - 1) {
                    return res.status(200).send({sponsoredChallenges, sponsoredChallengeBalances, sponsoredChallengeRemainingRedemptions});
                }
            });
        } else {
            return res.status(200).send({sponsoredChallenges: [], sponsoredChallengeBalances: [], sponsoredChallengeRemainingRedemptions: []});
        }
    },
    async retrieveHeldChallenges({params}, res) {
        const heldChallenges = [];
        const heldChallengeBalances = [];
        const heldChallengeRemainingRedemptions = [];
        const holderWalletAddress = params.holderWalletAddress;
        const wallet = await Wallet.findOne({ where: { address: holderWalletAddress } });
        if (!wallet) {
            return res.status(200).send({heldChallenges: [], heldChallengeBalances: [], heldChallengeRemainingRedemptions: []});
        }
        const allChallenges = await Challenge.findAll({where: {isComplete: false}, include: [{model: Transaction, as: 'transactions'}]});
        allChallenges.forEach(async (challenge, index) => {
            if (challenge.sponsorWalletAddress !== holderWalletAddress) {
                const challengeBalance = await walletBalance(holderWalletAddress, challenge.uuid);
                if (challengeBalance && challengeBalance > 0) {
                    heldChallenges.push(challenge);
                    heldChallengeBalances.push(challengeBalance);
                    const redeemedTransactions = await Transaction.findAll({
                        where: {
                            uuid: challenge.uuid,
                            toAddress: TOKEN_GRAVEYARD_ADDRESS
                        }
                    });
                    heldChallengeRemainingRedemptions.push(challenge.maxRedemptions - redeemedTransactions.length);
                }
            }
            if (index === allChallenges.length - 1) {
                if (heldChallenges.length < 1) {
                    return res.status(200).send({heldChallenges: [], heldChallengeBalances: [], heldChallengeRemainingRedemptions: []});
                } else {
                    return res.status(200).send({heldChallenges, heldChallengeBalances, heldChallengeRemainingRedemptions});
                }
            }
        });
    },
    async retrieveAllChallengeBalances({params}, res) {
        let challengeBalances = {};
        const challengeUuid = params.challengeUuid;
        const challenge = await Challenge.find({
            where: {
                uuid: challengeUuid
            }
        });
        const challengeTransactions = await Transaction.findAll({
            where: {
                challengeUuid
            }
        });

        if (challengeTransactions) {
            challengeTransactions.forEach(transaction => {
                const fromAddress = transaction.fromAddress;
                const toAddress = transaction.toAddress;
                const numShares = transaction.numShares;

                if (fromAddress !== TOKEN_GRAVEYARD_ADDRESS && fromAddress !== challenge.sponsorWalletAddress) {
                    challengeBalances[fromAddress] -= numShares;
                }

                if (toAddress !== TOKEN_GRAVEYARD_ADDRESS && toAddress !== challenge.sponsorWalletAddress) {
                    if (!challengeBalances[toAddress]) {
                        challengeBalances[toAddress] = numShares;
                    } else {
                        challengeBalances[toAddress] += numShares;
                    }
                }
            })
        } else {
            return res.status(403).send({message: "challenge has no transactions"});
        }

        return res.status(200).send({challengeBalances});
    }
};

module.exports = challengesController;
