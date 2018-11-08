const { Challenge, Transaction, Wallet, TokenType } = require('../models');
const StellarSdk = require("stellar-sdk");
const nacl = require("tweetnacl");
const dec = require("../utils/dec");
const _ = require('lodash');

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

const getChildrenTransactions = async (parentTransaction) => {
    return await Transaction.findAll({
        where: {parentTransaction}
    });
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
        const { name, description, imageUrl, expiration, tokenTypeUuid, rewardAmount, rewardType, maxShares, maxRedemptions, signed } = body;
        const sponsorWalletAddress = params.address;
        const wallet = await Wallet.findOne({ where: { address: sponsorWalletAddress } });
        if (!wallet) {
            const wallet = await Wallet.create({ address: sponsorWalletAddress })
        }
        const tokenType = await TokenType.findById(tokenTypeUuid);
        if (!tokenType) {
            return res.status(404).send({ message: "TokenType not found" });
        }
        const challenge = await Challenge.create({
            name,
            description,
            imageUrl,
            expiration,
            tokenTypeUuid,
            rewardAmount,
            rewardType,
            maxShares,
            maxRedemptions,
            sponsorWalletAddress,
            isComplete: false
        });

        const reconstructedObject = { rewardAmount, name, description, imageUrl, expiration, tokenTypeUuid, rewardType, maxShares, maxRedemptions };
        if (!isVerified(sponsorWalletAddress, signed, reconstructedObject)) {
            return res.status(403).send({ message: "Invalid transaction signing" });
        }

        const transaction = await Transaction.create({
            amount: rewardAmount,
            fromAddress: sponsorWalletAddress,
            toAddress: sponsorWalletAddress,
            numShares: rewardAmount,
            challengeUuid: challenge.uuid
        });
        res.status(200).send({challenge, transaction});
    },
    async retrieveSponsoredChallenges({params}, res) {
        const sponsorWalletAddress = params.sponsorWalletAddress;
        const wallet = await Wallet.findOne({ where: { address: sponsorWalletAddress } });
        if (!wallet) {
            return res.status(200).send({ sponsoredChallenges: [] });
        }
        const sponsoredChallenges = await Challenge.findAll({where: {sponsorWalletAddress, isComplete: false}});
        res.status(200).send({sponsoredChallenges});
    },
    async retrieveHeldChallenges({params}, res) {
        const heldChallenges = [];
        const holderWalletAddress = params.holderWalletAddress;
        const wallet = await Wallet.findOne({ where: { address: holderWalletAddress } });
        if (!wallet) {
            return res.status(200).send({ heldChallenges: [] });
        }
        const allChallenges = await Challenge.findAll({where: {isComplete: false}, include: [{model: Transaction, as: 'transactions'}]});
        allChallenges.forEach(challenge => {
            if (challenge.transactions.length > 1 && challenge.transactions[challenge.transactions.length - 1].toAddress === holderWalletAddress) {
                heldChallenges.push(challenge);
            }
        });
        res.status(200).send({heldChallenges});
    },
    async retrieveAllLeafNodeTransactions({params}, res) {
        let leafNodeTransactions = [];
        const challengeUuid = params.challengeUuid;
        const challenge = await Challenge.find({where: {uuid: challengeUuid}, include: [{model: Transaction, as: 'transactions'}]});

        if (!challenge) {
            return res.status(404).send({message: "Challenge not found"});
        }

        const allTransactions = challenge.transactions;
        if (allTransactions && allTransactions.length < 1) {
            return res.status(200).send({leafNodeTransactions});
        }

        allTransactions.forEach(async transaction => {
            const childrenTransactions = await getChildrenTransactions(transaction.uuid);
            if (childrenTransactions && childrenTransactions.length) {
                leafNodeTransactions.push(transaction);
            }
        });

        return res.status(200).send({leafNodeTransactions});
    }
};

module.exports = challengesController;
