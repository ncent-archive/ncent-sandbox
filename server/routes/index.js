const tokentypesController = require('../controllers').tokentypes;
const transactionsController = require('../controllers').transactions;
const walletsController = require('../controllers').wallets;

module.exports = (app) => {
  app.get('/api', (req, res) => res.status(200).send({
    message: 'Welcome to the NCNT API!',
  }));
  
  app.get('/api/wallets', walletsController.listAll);
  app.get('/api/wallets/:address', walletsController.retrieve);
  app.get('/api/wallets/:address/:tokenTypeUuid', walletsController.retrieveBalance);

  app.post('/api/tokentypes', tokentypesController.create);
  app.get('/api/tokentypes', tokentypesController.listAll);
  app.get('/api/tokentypes/:tokenTypeUuid', tokentypesController.listOne);

  app.get('/api/transactions/', transactionsController.list);
  app.post('/api/transactions/:tokenTypeUuid/:address', transactionsController.create);
  app.post('/api/transactions/redeem', transactionsController.redeem);
  app.post('/api/transactions/:transactionUuid', transactionsController.share);
  app.get("/api/transactions/:transactionUuid", transactionsController.provenanceChain);
  app.get("/api/transactions/:tokenTypeUuid/:address", transactionsController.provenanceChainFIFO);
};
