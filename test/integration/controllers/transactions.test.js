// const StellarSdk = require('stellar-sdk');
// const transactions = require('../../../server/controllers').transactions;
// const db = require('../../../server/models');
// const { TokenType, Wallet, Transaction } = db;

// describe('Provenance and Redemption', () => {
//     const INITIAL_WALLET_AMOUNT = 10000;
//     const AMOUNT = 1000;
//     let tokenType;
//     let walletOwnerKeypair;

//     beforeEach(async (done) => {
//         walletOwnerKeypair = StellarSdk.Keypair.random();
//         tokenType = await TokenType.create({
//             Name: 'tokenName',
//             ExpiryDate: '2020',
//             sponsor_uuid: walletOwnerKeypair.publicKey(),
//             totalTokens: 10000,
//         });
//         await Wallet.create({
//             wallet_uuid: walletOwnerKeypair.publicKey(),
//             tokentype_uuid: tokenType.uuid,
//             balance: INITIAL_WALLET_AMOUNT,
//         });
//         done();
//     });

//     afterEach(async (done) => {
//         await TokenType.destroy({ where: {} });
//         await Wallet.destroy({ where: {} });
//         await Transaction.destroy({ where: {} });
//         done();
//     });

//     it('reliably gives provenance chain', async (done) => {
//         let receiver3 = StellarSdk.Keypair.random();
//         await createOriginTransaction(walletOwnerKeypair, tokenType.uuid, AMOUNT, async (tObject) =>{
//             const receiver1 = tObject.receiverKeypair;
//             const transaction1Uuid = tObject.transaction.txn.dataValues.uuid;
//             await createOriginTransaction(walletOwnerKeypair, tokenType.uuid, AMOUNT, async (tObject2) =>{
//                 const receiver2 = tObject2.receiverKeypair;
//                 const transaction2Uuid = tObject2.transaction.txn.dataValues.uuid;
//                 await createChildTransactionWithKeypair(receiver1, receiver3, transaction1Uuid, tokenType.uuid, () =>{});
//                 await createChildTransactionWithKeypair(receiver2, receiver3, transaction2Uuid, tokenType.uuid, async () =>{
//                     const tests = (provenanceChain) => {
//                         expect(provenanceChain.length).toBe(2);
//                         expect(provenanceChain[0].uuid).toBe(transaction1Uuid);
//                         expect(provenanceChain[1].fromAddress).toBe(receiver1.publicKey());
//                         expect(provenanceChain[1].toAddress).toBe(receiver3.publicKey());
//                         console.log(provenanceChain.length);
//                         done();
//                     };
//                     await transactions.oldestProvenanceChain({
//                         params: {
//                             wallet_uuid: receiver3.publicKey(),
//                             tokentype_uuid: tokenType.uuid
//                         }
//                     }, new psuedoRes(tests));
//                 });
//             });
//         });
//     });

// });