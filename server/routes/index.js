const tokentypesController = require('../controllers').tokentypes;
const transactionsController = require('../controllers').transactions;
const walletsController = require('../controllers').wallets;

module.exports = (app) => {
  app.get('/api', (req, res) => res.status(200).send({
    message: 'Welcome to the NCNT API!',
  }));

  app.post('/api/tokentypes', tokentypesController.create);
  app.get('/api/tokentypes', tokentypesController.listAll);
  app.get('/api/tokentypes/:tokenTypeUuid', tokentypesController.listOne);

  app.get('/api/transactions/', transactionsController.list);
  app.post('/api/transactions/:tokenTypeUuid/:address', transactionsController.create);
  app.post('/api/transactions/:transactionUuid', transactionsController.share);
  app.get("/api/transactions/:transactionUuid", transactionsController.provenanceChain);
  app.get("/api/transactions/:tokenTypeUuid/:address", transactionsController.provenanceChainFIFO);

  app.get('/api/wallets', walletsController.listAll);
  app.get('/api/wallets/:address', walletsController.retrieve);

  // For any other request
  app.all('/api/', (_, res) => {
    res.status(405).send({ message: 'Method Not Allowed' });
  });
};
