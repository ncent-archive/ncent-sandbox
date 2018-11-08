const {Transaction, Wallet, TokenType, Challenge} = require('../models');
const nacl = require("tweetnacl");
const StellarSdk = require("stellar-sdk");
const dec = require("../utils/dec");
const TOKEN_GRAVEYARD_ADDRESS = process.env.TOKEN_GRAVEYARD_ADDRESS;

const getGivenTransactions = async (publicKey, challengeUuid) => {
    return await Transaction.findAll({
        where: {fromAddress: publicKey, challengeUuid}
    });
};

const getReceivedTransactions = async (publicKey, challengeUuid) => {
    return await Transaction.findAll({
        where: {toAddress: publicKey, challengeUuid},
        order: [["updatedAt", "DESC"]] // newest to oldest
    });
};
// Receives: publicKey, tokenTypeUuid
// Returns: oldest transaction of a wallet that has no child transactions
const getOldestTransaction = async (givenTransactions, receivedTransactions) => {
    const parentTransactionUuids = new Set();

    givenTransactions.forEach((transaction) => {
        parentTransactionUuids.add(transaction.parentTransaction);
    });

    for (let i = receivedTransactions.length - 1; i >= 0; i--) {
        const transaction = receivedTransactions[i];
        if (!parentTransactionUuids.has(transaction.uuid)) {
            return transaction;
        }
    }
};
// Receives: Any transaction
// Returns: chain of transactions from initial challenge to given transaction
// Order: (challenge -> ... -> transaction)
const getProvenanceChain = async (transaction) => {
    const transactionChain = [];
    do {
        transactionChain.unshift(transaction);
        transaction = await Transaction.findById(transaction.parentTransaction);
    } while (transaction);
    return transactionChain;
};

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

const transactionsController = {
    // GET ()
    // -> [{transactionData}...{transactionData}]
    async list(_, res) {
        try {
            const allTransactions = await Transaction.findAll({});
            res.status(200).send(allTransactions);
        } catch (error) {
            res.status(400).send(error);
        }
    },
    // POST (params: {walletUuid, tokenTypeUuid}, body: {numShares, signed})
    // -> createdTransaction // this is just the "challenge" issued to creator
    async create({body, params}, res) {
        const {address, challengeUuid} = params;
        const signed = body.signed;
        const numShares = parseInt(body.numShares, 10);
        const wallet = await Wallet.findOne({where: {address}});
        if (!wallet) {
            return res.status(404).send({message: "Wallet not found"});
        }
        const challenge = await Challenge.findById(challengeUuid);
        if (!challenge) {
            return res.status(404).send({message: "Challenge not found"});
        }
        if (challenge.sponsorWalletAddress !== address) {
            return res.status(404).send({message: "Wallet !== Challenge sponsor"});
        }
        const reconstructedObject = {numShares};
        if (!isVerified(address, signed, reconstructedObject)) {
            return res.status(403).send({message: "Invalid transaction signing"});
        }
        const transaction = await Transaction.create({
            numShares,
            fromAddress: address,
            toAddress: address,
            challengeUuid
        });
        res.status(200).send(transaction);
    },
    //POST (params: {transactionUuid}, body: {fromAddress, toAddress, signed})
    // -> transaction between fromAddress and toAddress, transferring "challenge"
    async share({body, params}, res) {
        const {challengeUuid} = params;
        const {fromAddress, toAddress, numShares, signed} = body;
        let givenShares;
        let receivedShares;

        const challenge = await Challenge.findOne({
            where: {uuid: challengeUuid},
            include: [{model: Transaction, as: 'transactions'}]
        });

        const givenTransactions = await getGivenTransactions(fromAddress, challenge.uuid);
        const receivedTransactions = await getReceivedTransactions(fromAddress, challenge.uuid);
        const oldestOwnedTransaction = await getOldestTransaction(givenTransactions, receivedTransactions);

        if (!challenge) {
            return res.status(404).send({message: "Challenge not found"});
        }
        if (fromAddress !== challenge.sponsorWalletAddress && (oldestOwnedTransaction && fromAddress !== oldestOwnedTransaction.toAddress)) {
            return res.status(403).send({message: "Unauthorized transfer"});
        }
        let fromWallet = await Wallet.findOne({where: {address: fromAddress}});
        if (!fromWallet) {
            return res.status(404).send({message: "Invalid fromAddress"});
        }
        let toWallet = await Wallet.findOne({where: {address: toAddress}});
        if (!toWallet) {
            toWallet = await Wallet.create({address: toAddress});
        }

        givenTransactions.forEach(transaction => {
            givenShares += transaction.numShares;
        });
        receivedTransactions.forEach(transaction => {
            receivedShares += transaction.numShares;
        });

        if (numShares > (receivedShares - givenShares)) {
            return res.status(403).send({message: "not enough shares to send"});
        }

        const reconstructedObject = {fromAddress, toAddress, numShares};
        if (!isVerified(fromAddress, signed, reconstructedObject)) {
            return res.status(403).send({message: "Invalid transaction signing"});
        }

        let parentUuid;
        if (oldestOwnedTransaction) {
            parentUuid = oldestOwnedTransaction.uuid;
        } else if (fromAddress === challenge.sponsorWalletAddress) {
            const parentTransaction = await Transaction.find({where: {fromAddress: challenge.sponsorWalletAddress, toAddress: challenge.sponsorWalletAddress}});
            parentUuid = parentTransaction.uuid;
        }
        const newTransaction = await Transaction.create({
            toAddress,
            fromAddress,
            numShares,
            parentTransaction: parentUuid,
            challengeUuid
        });
        const data = {transaction: newTransaction};
        res.status(200).send(data);
    },
    // GET (params: {transactionUuid})
    // -> [challengeTransaction, transaction2...transaction]
    // array of transactions leading to transaction w/ transactionUuid
    async provenanceChain({params}, res) {
        let transaction = await Transaction.findById(params.transactionUuid);
        if (!transaction) {
            return res.status(404).send({message: "transactionUuid is invalid"});
        }
        if (transaction.toAddress === transaction.fromAddress) {
            return res.status(400).send({message: "Challenge has no provenance"});
        }
        const transactionChain = await getProvenanceChain(transaction);
        res.status(200).send(transactionChain);
    },
    // GET (params: {walletUuid, tokenTypeUuid})
    // -> [challengeTransaction, transaction2...transaction]
    // returns provenanceChain of oldest "challenge" that hasn't been shared
    async provenanceChainFIFO({params}, res) {
        const {address, tokenTypeUuid} = params;
        const wallet = await Wallet.findOne({where: {address}});
        if (!wallet) {
            return res.status(404).send({message: "Wallet not found"});
        }
        const tokenType = await TokenType.findById(tokenTypeUuid);
        if (!tokenType) {
            return res.status(404).send({message: "TokenType not found"});
        }
        const givenTransactions = await getGivenTransactions(address, tokenTypeUuid);
        const receivedTransactions = await getReceivedTransactions(address, tokenTypeUuid);
        const oldestOwnedTransaction = await getOldestTransaction(givenTransactions, receivedTransactions);

        if (!oldestOwnedTransaction) {
            return res.status(404).send({message: "No owned challenges"});
        }
        const transactionChain = await getProvenanceChain(oldestOwnedTransaction);
        res.status(200).send(transactionChain);
    },
    // POST (body: { transactionUuid, signed })
    // -> transaction w/ tokenGraveyard
    async redeem({body}, res) {
        const {challengeUuid, redeemerAddress, signed} = body;
        const challenge = await Challenge.findOne({
            where: {uuid: challengeUuid},
            include: [{model: Transaction, as: 'transactions'}]
        });
        if (!challenge) {
            return res.status(404).send({message: "Challenge not found"});
        }

        const redeemerWallet = await Wallet.findOne({where: {address: toAddress}});
        if (!redeemerWallet) {
            return res.status(404).send({message: "redeemer wallet not found"});
        }

        if (challenge.isComplete) {
            return res.status(403).send({message: "Challenge has already been completed"});
        }

        const tokenType = await TokenType.findById(challenge.tokenTypeUuid);
        const reconstructedObject = {challengeUuid, redeemerAddress};
        if (!isVerified(tokenType.sponsorUuid, signed, reconstructedObject)) {
            return res.status(403).send({
                message: "Only the TokenType sponsor can trigger redemption"
            });
        }

        const givenTransactions = await getGivenTransactions(redeemerAddress, challenge.tokenTypeUuid);
        const receivedTransactions = await getReceivedTransactions(redeemerAddress, challenge.tokenTypeUuid);
        const oldestTransaction = await getOldestTransaction(givenTransactions, receivedTransactions);

        let givenShares = [];
        let receivedShares = [];

        givenTransactions.forEach(transaction => {
            givenShares += transaction.numShares;
        });
        receivedTransactions.forEach(transaction => {
            receivedShares += transaction.numShares;
        });

        if (receivedShares - givenShares <= 0) {
            return res.status(403).send({message: "not enough shares left for redemption"});
        }

        const newTransaction = await Transaction.create({
            fromAddress: redeemerAddress,
            toAddress: TOKEN_GRAVEYARD_ADDRESS,
            numShares: 1,
            challengeUuid: challenge.uuid,
            parentTransaction: oldestTransaction.uuid
        });

        const redeemedTransactions = await Transaction.find({
            where: {
                challengeUuid,
                toAddress: TOKEN_GRAVEYARD_ADDRESS
            }
        });

        if (redeemedTransactions && redeemedTransactions.length === challenge.maxRedemptions) {
            await challenge.update({isComplete: true});
        }

        const sponsoredChallenges = await Challenge.findAll({
            where: {
                sponsorWalletAddress: challenge.sponsorWalletAddress,
                isComplete: false
            }
        });
        const heldChallenges = [];
        const allChallenges = await Challenge.findAll({
            where: {isComplete: false},
            include: [{model: Transaction, as: 'transactions'}]
        });
        allChallenges.forEach(challenge => {
            if (challenge.transactions.length > 1 && challenge.transactions[challenge.transactions.length - 1].toAddress === challenge.sponsorWalletAddress) {
                heldChallenges.push(challenge);
            }
        });
        res.status(200).send({sponsoredChallenges, heldChallenges, redeemTransaction: newTransaction});
    }
};

module.exports = transactionsController;