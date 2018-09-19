const Wallet = require('../models').Wallet;

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
  }
};

module.exports = walletsController;