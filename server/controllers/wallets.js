const {Wallet, TokenType, Transaction, Sequelize} = require('../models');
const Op = Sequelize.Op;
const calculateWalletOwnerBalance = async (publicKey, tokenType) => {
  let balance = tokenType.totalTokens;
  const fromTransactions = await Transaction.findAll({ where: {
    fromAddress: publicKey,
    toAddress: {
      [Op.ne]: publicKey // to avoid the challenge transactions (from === to)
  }}});
  fromTransactions.forEach((transaction) => {
    balance -= transaction.amount;
  });
  return balance;
}

const calculateWalletBalance = async (publicKey, tokenTypeUuid) => {
  let balance = 0;
  const toTransactions = await Transaction.findAll({
    where: { toAddress: publicKey, tokenTypeUuid }
  });
  const fromTransactions = await Transaction.findAll({
    where: { fromAddress: publicKey, tokenTypeUuid }
  });
  toTransactions.forEach((transaction) => {
    balance += transaction.amount;
  });
  fromTransactions.forEach((transaction) => {
    balance -= transaction.amount;
  });
  return balance;
}

const walletsController = {
  async listAll(_, res) {
    try {
      const allWallets = await Wallet.findAll({});
      res.status(200).send(allWallets);
    } catch (e) {
      res.status(400).send(e);
    }
  },

  async retrieve({ params }, res) {
    const { address } = params;
    try {
      const wallet = await Wallet.findOne({ where: { address } });
      if (!wallet) {
        return res.status(404).send({ message: 'Wallet not found' });
      }
      res.status(200).send(wallet);
    } catch (e) {
      res.status(400).send(e);
    }
  },

  async retrieveBalance({ params }, res) {
    const { address, tokenTypeUuid } = params;
    try {
      const wallet = await Wallet.findOne({ where: { address } });
      if (!wallet) {
        return res.status(404).send({ message: 'Wallet not found' });
      }
      const tokenType = await TokenType.findById(tokenTypeUuid);
      if (!tokenType) {
        return res.status(404).send({ message: 'TokenType not found' });
      }
      let balance;
      if (address === tokenType.sponsorUuid) {
        balance = await calculateWalletOwnerBalance(address, tokenType);
      } else {
        balance = await calculateWalletBalance(address, tokenTypeUuid);
      }
      res.status(200).send({wallet, balance});
    } catch (e) {
      res.status(400).send(e);
    }
  }
};

module.exports = walletsController;