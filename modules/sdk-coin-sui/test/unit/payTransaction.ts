// import { coins } from '@bitgo/statics';
// import should from 'should';
// import { Transaction, TransferTransaction } from '../../src';
// import * as testData from '../resources/sui';
// import { PayTx } from '../../src/lib/iface';
//
// describe('Sui Pay Transaction', () => {
//   let tx: Transaction<PayTx>;
//   const config = coins.get('tsui');
//
//   beforeEach(() => {
//     tx = new TransferTransaction(config);
//   });
//
//   describe('Empty transaction', () => {
//     it('should throw empty transaction', function () {
//       should.throws(() => tx.toJson(), 'Empty transaction');
//       should.throws(() => tx.toBroadcastFormat(), 'Empty transaction');
//     });
//   });
//
//   describe('From raw transaction', () => {
//     it('should build a transfer from raw hex', function () {
//       tx.fromRawTransaction(testData.TRANSFER_PAY_TX);
//       const json = tx.toJson();
//       should.equal(json.sender, testData.sender.address);
//     });
//     it('should fail to build a transfer from incorrect raw hex', function () {
//       should.throws(() => tx.fromRawTransaction('random' + testData.TRANSFER_PAY_TX), 'incorrect raw data');
//     });
//   });
//
//   describe('Explain transaction', () => {
//     it('should explain a transfer pay transaction', function () {
//       tx.fromRawTransaction(testData.TRANSFER_PAY_TX);
//       const explainedTransaction = tx.explainTransaction();
//       explainedTransaction.should.deepEqual({
//         displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
//         id: 'UNAVAILABLE',
//         outputs: [
//           {
//             address: testData.recipients[0],
//             amount: testData.AMOUNT.toString(),
//           },
//         ],
//         outputAmount: testData.AMOUNT,
//         changeOutputs: [],
//         changeAmount: '0',
//         fee: { fee: testData.gasData.budget.toString() },
//         type: 0,
//       });
//     });
//
//     it('should explain a transfer payAll transaction', function () {
//       tx.fromRawTransaction(testData.TRANSFER_PAY_ALL_SUI_TX_WITH_GAS_PAYMENT_AND_IN_PAYTX);
//       const explainedTransaction = tx.explainTransaction();
//       explainedTransaction.should.deepEqual({
//         displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
//         id: 'UNAVAILABLE',
//         outputs: [
//           {
//             address: testData.recipients[0],
//             amount: '', // deserialize doesn't return amount for PayAllSui
//           },
//         ],
//         outputAmount: 0,
//         changeOutputs: [],
//         changeAmount: '0',
//         fee: { fee: testData.gasData.budget.toString() },
//         type: 0,
//       });
//     });
//
//     it('should fail to explain transaction with invalid raw hex', function () {
//       should.throws(() => tx.fromRawTransaction('randomString'), 'Invalid transaction');
//     });
//   });
// });
