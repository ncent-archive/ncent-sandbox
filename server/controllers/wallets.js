const {Challenge, Wallet, Transaction, Sequelize} = require('../models');
const Op = Sequelize.Op;

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

const walletsController = {
    async listAll(_, res) {
        try {
            const allWallets = await Wallet.findAll({});
            res.status(200).send(allWallets);
        } catch (e) {
            res.status(400).send(e);
        }
    },

    async retrieve({params}, res) {
        const {address} = params;
        try {
            const wallet = await Wallet.findOne({where: {address}});
            if (!wallet) {
                return res.status(404).send({message: 'Wallet not found'});
            }
            res.status(200).send(wallet);
        } catch (e) {
            res.status(400).send(e);
        }
    },

    async retrieveBalance({params}, res) {
        const {address, challengeUuid} = params;
        try {
            const wallet = await Wallet.findOne({where: {address}});
            if (!wallet) {
                return res.status(404).send({message: 'Wallet not found'});
            }
            const challenge = await Challenge.findById(challengeUuid);
            if (!challenge) {
                return res.status(404).send({message: 'challenge not found'});
            }
            const balance = await walletBalance(address, challenge);
            res.status(200).send({wallet, balance});
        } catch (e) {
            res.status(400).send(e);
        }
    }
};

module.exports = walletsController;