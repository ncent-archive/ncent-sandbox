const tokentypesController = require('../controllers').tokentypes;
const transactionsController = require('../controllers').transactions;
const walletsController = require('../controllers').wallets;
const challengesController = require('../controllers').challenges;

module.exports = (app) => {
    app.get('/api', (req, res) => res.status(200).send({
        message: 'Welcome to the NCNT API!',
    }));

    app.get('/api/wallets', walletsController.listAll);
    app.get('/api/wallets/:address', walletsController.retrieve);
    app.get('/api/wallets/:address/:challengeUuid', walletsController.retrieveBalance);

    app.post('/api/tokentypes', tokentypesController.create);
    app.get('/api/tokentypes', tokentypesController.listAll);
    app.get('/api/tokentypes/:tokenTypeUuid', tokentypesController.listOne);

    app.get('/api/transactions/', transactionsController.list);
    app.post('/api/transactions/:challengeUuid/:address', transactionsController.create);
    app.post('/api/transactions/redeem/', transactionsController.redeem);
    app.post('/api/transactions/:challengeUuid', transactionsController.share);
    app.get("/api/transactions/:transactionUuid", transactionsController.provenanceChain);
    app.get("/api/transactions/:challengeUuid/:address", transactionsController.provenanceChainFIFO);

    app.get('/api/challenges/', challengesController.list);
    app.get('/api/challenges/:challengeUuid', challengesController.retrieve);
    app.post('/api/challenges/:address', challengesController.create);
    app.get('/api/challenges/sponsoredChallenges/:sponsorWalletAddress', challengesController.retrieveSponsoredChallenges);
    app.get('/api/challenges/heldChallenges/:holderWalletAddress', challengesController.retrieveHeldChallenges);
    app.get('/api/challenges/balances/:challengeUuid', challengesController.retrieveAllChallengeBalances);
};
