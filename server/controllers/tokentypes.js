const TokenType = require('../models').TokenType;
const Transaction = require('../models').Transaction;
const Wallet = require('../models').Wallet;

const tokenTypeController = {
  // POST ({body: {name, expiryDate, sponsorUuid, totalTokens}})
  // -> {tokenType, wallet}
  async create({body}, res) {
    const { name, sponsorUuid, expiryDate, totalTokens } = body;
    try {
      const tokenType = await TokenType.create({
        name,
        expiryDate,
        sponsorUuid,
        totalTokens
      });
      let wallet = await Wallet.findOne({ where: { address: sponsorUuid }});
      if (!wallet) {
        wallet = await Wallet.create({ address: sponsorUuid })
      }
      const data = {
        wallet,
        tokenType
      };
      res.status(200).send(data);
    } catch (e) {
      res.status(400).send(e);
    }
  },
  // GET ()
  // -> [{tokenType, [transaction...transaction]}...]
  async listAll(_, res) {
    try {
      const tokenTypesWithTransactions = await TokenType.findAll({
          include: [{
            model: Transaction,
            as: 'transactions',
          }],
      });
      res.status(200).send(tokenTypesWithTransactions);
    } catch (e) {
      res.status(400).send(e);
    }
  },
  // GET ({params: {tokenTypeUuid}})
  // -> {tokenType, [transaction...transaction]}
  async listOne({params}, res) {
    try {
      const { tokenTypeUuid } = params;
      const tokenTypeWithTransactions = await TokenType.findById(tokenTypeUuid, {
        include: [{
          model: Transaction,
          as: 'transactions',
        }],
      });
      if (!tokenTypeWithTransactions) {
        return res.status(404).send({ message: "TokenType not found"});
      }
      res.status(200).send(tokenTypeWithTransactions);
    } catch(e) {
      res.status(400).send(e);
    }
  }
};

module.exports = tokenTypeController;