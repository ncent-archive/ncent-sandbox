const { Challenge, Transaction, Wallet, TokenType } = require('../models');
const StellarSdk = require("stellar-sdk");
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

const challengesController = {
    async list(_, res) {
        try {
            const allChallenges = await Challenge.findAll({});
            res.status(200).send(allChallenges);
        } catch(error) { res.status(400).send(error); }
    },
    async create({body, params}, res) {
        const { name, expiration, tokenTypeUuid, rewardAmount, signed } = body;
        const sponsorWalletAddress = params.address;
        const wallet = await Wallet.findOne({ where: { address: sponsorWalletAddress } });
        if (!wallet) {
            return res.status(404).send({ message: "Wallet not found" });
        }
        const tokenType = await TokenType.findById(tokenTypeUuid);
        if (!tokenType) {
            return res.status(404).send({ message: "TokenType not found" });
        }
        if (tokenType.sponsorUuid !== sponsorWalletAddress) {
            return res.status(404).send({message:"Wallet !== TokenType sponsor"});
        }
        const challenge = await Challenge.create({
            name,
            expiration,
            tokenTypeUuid,
            rewardAmount,
            sponsorWalletAddress
        });

        const reconstructedObject = { amount: rewardAmount };
        if (!isVerified(address, signed, reconstructedObject)) {
            return res.status(403).send({ message: "Invalid transaction signing" });
        }

        const transaction = await Transaction.create({
            amount: rewardAmount,
            fromAddress: sponsorWalletAddress,
            toAddress: sponsorWalletAddress,
            tokenTypeUuid
        });
        res.status(200).send(_.merge({}, challenge, transaction));
    }
};

module.exports = challengesController;