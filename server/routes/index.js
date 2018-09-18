const tokentypesController = require('../controllers').tokentypes;
const transactionsController = require('../controllers').transactions;
const walletsController = require('../controllers').wallets;

module.exports = (app) => {
    app.get('/api', (req, res) => res.status(200).send({
        message: 'Welcome to the NCNT API!',
    }));

    app.post('/api/tokentypes', tokentypesController.create);
    app.get('/api/tokentypes', tokentypesController.list);
    app.get('/api/tokentypes/:tokentype_uuid', tokentypesController.retrieve);
    
    app.get('/api/transactions/', transactionsController.list);
    app.get("/api/transactions/:transactionUuid", transactionsController.provenanceChain);
    app.get("/api/transactions/:tokentype_uuid/:wallet_uuid", transactionsController.provenanceChainFIFO);
    app.post('/api/transactions/:tokentypeUuid/:walletUuid', transactionsController.create);
    app.post('/api/transactions/:transactionUuid', transactionsController.share);

    app.get('/api/wallets', walletsController.listAll);
    app.get('/api/wallets/:wallet_uuid', walletsController.listSome);
    app.get('/api/wallets/:wallet_uuid/:tokentype_uuid', walletsController.retrieve);

    // For any other request method on transactions, we're going to return "Method Not Allowed"
    app.all('/api/todos/:todoId/items', (req, res) =>
        res.status(405).send({
            message: 'Method Not Allowed',
    }));
};
