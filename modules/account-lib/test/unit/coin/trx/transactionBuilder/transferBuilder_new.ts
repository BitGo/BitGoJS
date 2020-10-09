// import should from 'should';
// import { register } from '../../../../../src/index';
// import { TransactionBuilderFactory } from '../../../../../src/coin/trx';
// import { TransactionType } from '../../../../../src/coin/baseCoin';
// import * as testData from '../../../../resources/trx/trx';

// describe('Tron TransactionBuilder', () => {
//   const factory = register('trx', TransactionBuilderFactory);

//   const initTxBuilder = () => {
//     const txBuilder = factory.getTransferBuilder();
//     txBuilder.source({ address: testData.ACCOUNT_1.address });
//     txBuilder.to({ address: testData.ACCOUNT_2.address });
//     txBuilder.amount('10');
//     return txBuilder;
//   };

//   describe('should build ', () => {
//     describe('non serialized transactions', () => {
//       it('a signed transfer transaction', async () => {
//         const builder = initTxBuilder();
//         builder.sign({ key: testData.FirstPrivateKey });
//         const tx = await builder.build();
//         console.log(tx);
//         const txJson = tx.toJson();
//         should.deepEqual(tx.signature.length, 1);
//         should.deepEqual(txJson.to, testData.ACCOUNT_1.address);
//         should.deepEqual(txJson.amount, '10');
//         should.deepEqual(txJson.from, testData.ACCOUNT_2.address);
//         should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_TRANSFER_TRANSACTION);
//         tx.type.should.equal(TransactionType.Send);

//         tx.outputs.length.should.equal(1);
//         tx.outputs[0].address.should.equal(testData.ACCOUNT_2.address);
//         tx.outputs[0].value.should.equal('10');
//         tx.inputs.length.should.equal(1);
//         tx.inputs[0].address.should.equal(testData.ACCOUNT_1.address);
//         tx.inputs[0].value.should.equal('10');
//       });

//       it('a transfer transaction signed multiple times', async () => {
//         const builder = initTxBuilder();
//         builder.sign({ key: testData.FirstPrivateKey });
//         builder.sign({ key: testData.SecondPrivateKey });
//         const tx = await builder.build();
//         // const txJson = tx.toJson();
//         should.deepEqual(tx.signature.length, 2);
//         should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_TRANSFER_TRANSACTION);
//       });

//       it('a transfer transaction with amount 0', async () => {
//         const builder = initTxBuilder();
//         builder.amount('0');
//         const tx = await builder.build();
//         const txJson = tx.toJson();
//         should.deepEqual(txJson.to, testData.ACCOUNT_2.address);
//         should.deepEqual(txJson.amount, '0');
//         should.deepEqual(txJson.from, testData.ACCOUNT_1.address);
//       });

//       it('a non signed transfer transaction', async () => {
//         const builder = initTxBuilder();
//         const tx = await builder.build();
//         const txJson = tx.toJson();
//         should.deepEqual(txJson.to, testData.ACCOUNT_2.address);
//         should.deepEqual(txJson.amount, '10');
//         should.deepEqual(txJson.from, testData.ACCOUNT_1.address);
//         should.deepEqual(tx.toBroadcastFormat(), testData.NON_SIGNED_TRANSFER_TRANSACTION);
//       });

//       it('a multisig transfer transaction', async () => {
//         const builder = initTxBuilder();
//         builder.sign({ key: testData.ACCOUNT_1.pk });
//         builder.sign({ key: testData.ACCOUNT_2.pk });
//         builder.sign({ key: testData.ACCOUNT_3.pk });
//         const tx = await builder.build();
//         should.deepEqual(tx.toBroadcastFormat(), testData.THREE_TIMES_SIGNED_TRANSACTION);
//       });
//     });

//     describe('serialized transactions', () => {
//       it('a non signed transfer transaction from serialized', async () => {
//         const builder = factory.from(testData.NON_SIGNED_TRANSFER_TRANSACTION);
//         builder.sign({ key: testData.ACCOUNT_1.pk });
//         const tx2 = await builder.build();
//         should.deepEqual(tx2.toBroadcastFormat(), testData.SIGNED_TRANSFER_TRANSACTION);
//         tx2.type.should.equal(TransactionType.Send);
//       });

//       it('a signed transfer transaction from serilaized', async () => {
//         const txBuilder = factory.from(testData.SIGNED_TRANSFER_TRANSACTION);
//         const tx = await txBuilder.build();
//         should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_TRANSFER_TRANSACTION);
//         tx.type.should.equal(TransactionType.Send);
//       });

//       it('an offline multisig transfer transaction', async () => {
//         const builder = initTxBuilder();
//         builder.sign({ key: testData.ACCOUNT_1.pk });
//         const tx = await builder.build();
//         should.deepEqual(tx.signature.length, 1);

//         const builder2 = factory.from(tx.toBroadcastFormat());
//         builder2.sign({ key: testData.ACCOUNT_2.pk });
//         const tx2 = await builder2.build();
//         should.deepEqual(tx2.signature.length, 2);

//         const builder3 = factory.from(tx2.toBroadcastFormat());
//         builder3.sign({ key: testData.ACCOUNT_3.pk });
//         const tx3 = await builder3.build();
//         should.deepEqual(tx3.signature.length, 3);

//         should.deepEqual(tx3.toBroadcastFormat(), testData.THREE_TIMES_SIGNED_TRANSACTION); // Obtain hash for offline multisig transfer transaction (check timestamp)
//       });
//     });
//   });

//   describe('should fail', () => {
//     it('a transfer transaction with an invalid key', () => {
//       const builder = initTxBuilder();
//       should.throws(
//         () => builder.sign({ key: 'invalidKey' }),
//         e => e.message === 'Invalid private key',
//       );
//     });

//     it('a transfer transaction with more signatures than allowed', () => {
//       const builder = initTxBuilder();
//       builder.sign({ key: testData.ACCOUNT_2.pk });
//       builder.sign({ key: testData.ACCOUNT_1.pk });
//       builder.sign({ key: testData.ACCOUNT_3.pk });
//       should.throws(
//         () => builder.sign({ key: '5bb72603f237c0993f7973d37fdade32c71aa94aee686aa79d260acba1882d90' }),
//         e => e.message === 'A maximum of 3 can sign the transaction.',
//       );
//     });

//     it('a transfer transaction with repeated sign', () => {
//       const builder = initTxBuilder();
//       builder.sign({ key: testData.ACCOUNT_1.pk });
//       should.throws(
//         () => builder.sign({ key: testData.ACCOUNT_1.pk }),
//         e =>
//           e.message ===
//           'Repeated sign: 302e020100300506032b65700422042062b0b669de0ab5e91b4328e1431859a5ca47e7426e701019272f5c2d52825b01',
//       );
//     });

//     it('a transfer transaction with an invalid destination address', () => {
//       const txBuilder = factory.getTransferBuilder();
//       should.throws(
//         () => txBuilder.to({ address: 'invalidaddress' }),
//         e => e.message === 'Invalid address',
//       );
//     });

//     it('a transfer transaction with an invalid amount: text value', () => {
//       const txBuilder = factory.getTransferBuilder();
//       should.throws(
//         () => txBuilder.amount('invalidamount'),
//         e => e.message === 'Invalid amount',
//       );
//     });

//     it('a transfer transaction with an invalid amount: negative value', () => {
//       const txBuilder = factory.getTransferBuilder();
//       should.throws(
//         () => txBuilder.amount('-5'),
//         e => e.message === 'Invalid amount',
//       );
//     });

//     it('a transfer transaction without destination param', async () => {
//       const txBuilder = factory.getTransferBuilder();
//       txBuilder.source({ address: testData.ACCOUNT_1.address });
//       txBuilder.amount('10');
//       await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing to');
//     });

//     it('a transfer transaction without amount', async () => {
//       const txBuilder = factory.getTransferBuilder();
//       txBuilder.source({ address: testData.ACCOUNT_1.address });
//       txBuilder.to({ address: testData.ACCOUNT_2.address });
//       await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing amount');
//     });
//   });
// });
