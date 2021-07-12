// import * as should from 'should';
// import * as ecc from 'eosjs-ecc';
// import * as bitcoin from '@bitgo/utxo-lib';

// import { TestBitGo } from '../../../lib/test_bitgo';
// import * as accountLib from '@bitgo/account-lib';
import * as accountLib from '@bitgo/account-lib';
import * as EosResources from '../../fixtures/coins/eos';
import { TestBitGo } from '../../../lib/test_bitgo';
import { EosTransactionExplanation } from '../../../../src/v2/coins/eos';

// describe('EOS:', function() {
//   let bitgo;
//   let basecoin;

//   before(function() {
//     bitgo = new TestBitGo({ env: 'test' });
//     bitgo.initializeTestVars();
//     basecoin = bitgo.coin('teos');
//   });

//   it('should get address details', function() {
//     let addressDetails = basecoin.getAddressDetails('i1skda3kso43');
//     addressDetails.address.should.equal('i1skda3kso43');
//     should.not.exist(addressDetails.memoId);

//     addressDetails = basecoin.getAddressDetails('ks13k3hdui24?memoId=1');
//     addressDetails.address.should.equal('ks13k3hdui24');
//     addressDetails.memoId.should.equal('1');

//     (() => { basecoin.getAddressDetails('ks13k3hdui24?memoId=x'); }).should.throw();
//     (() => { basecoin.getAddressDetails('ks13k3hdui24?memoId=1&memoId=2'); }).should.throw();
//   });

//   it('should validate address', function() {
//     basecoin.isValidAddress('i1skda3kso43').should.equal(true);
//     basecoin.isValidAddress('ks13kdh245ls').should.equal(true);
//     basecoin.isValidAddress('ks13k3hdui24?memoId=1').should.equal(true);
//     basecoin.isValidAddress('ks13k3hdui24?memoId=x').should.equal(false);
//   });

//   it('verifyAddress should work', function() {
//     basecoin.verifyAddress({
//       address: 'i1skda3kso43',
//       rootAddress: 'i1skda3kso43',
//     });
//     basecoin.verifyAddress({
//       address: 'ks13kdh245ls?memoId=1',
//       rootAddress: 'ks13kdh245ls',
//     });

//     (() => {
//       basecoin.verifyAddress({
//         address: 'i1skda3kso43?memoId=243432',
//         rootAddress: 'ks13kdh245ls',
//       });
//     }).should.throw();

//     (() => {
//       basecoin.verifyAddress({
//         address: 'i1skda3kso43=x',
//         rootAddress: 'i1skda3kso43',
//       });
//     }).should.throw();

//     (() => {
//       basecoin.verifyAddress({
//         address: 'i1skda3kso43',
//       });
//     }).should.throw();
//   });

//   it('should generate valid random addresses', () => {
//     for (let i = 0; i < 100; i++) {
//       const address = basecoin.generateRandomAddress();
//       basecoin.isValidAddress(address).should.be.true();
//     }
//   });

//   it('isValidMemoId should work', function() {
//     basecoin.isValidMemo({ value: '1' }).should.equal(true);
//     basecoin.isValidMemo({ value: 'uno' }).should.equal(true);
//     const string257CharsLong = '4WMNlu0fFU8N94AwukfpfPPQn2Myo80JdmLNF5rgeKAab9XLD93KUQipcT6US0LRwWWIGbUt89fjmdwpg3CBklNi8QIeBI2i8UDJCEuQKYobR5m4ismm1RooTXUnw5OPjmfLuuajYV4e5cS1jpC6hez5X43PZ5SsGaHNYX2YYXY03ir54cWWx5QW5VCPKPKUzfq2UYK5fjAG2Fe3xCUOzqgoR6KaAiuOOnDSyhZygLJyaoJpOXZM9olblNtAW75Ed';
//     basecoin.isValidMemo({ value: string257CharsLong }).should.equal(false);
//   });

//   it('should validate pub key', () => {
//     const { pub } = basecoin.keychains().create();
//     basecoin.isValidPub(pub).should.equal(true);
//   });

//   describe('Keypairs:', () => {
//     it('should generate a keypair from random seed', function() {
//       const keyPair = basecoin.generateKeyPair();
//       keyPair.should.have.property('pub');
//       keyPair.should.have.property('prv');

//       basecoin.isValidPub(keyPair.pub).should.equal(true);
//       basecoin.isValidPrv(keyPair.prv).should.equal(true);
//     });

//     it('should generate a keypair from seed', function() {
//       const seed = Buffer.from('c3b09c24731be2851b641d9d5b3f60fa129695c24071768d15654bea207b7bb6', 'hex');
//       const keyPair = basecoin.generateKeyPair(seed);

//       keyPair.pub.should.equal('xpub661MyMwAqRbcF2SUqUMiqxWGwaVX6sH4okTtX8jxJ1A14wfL8W7jZEoNE537JqSESXFpTcXCZahPz7RKQLpAEGsVp233dc5CffLSecpU13X');
//       keyPair.prv.should.equal('xprv9s21ZrQH143K2YN1jSpiUpZYPYf2hQZDSXYHikLLjfd2C9LBaxoV1SUtNnZGnXeyJ6uFWMbQTfjXqVfgNqRBw5yyaCtBK1AM8PF3XZtKjQp');
//     });
//   });

//   describe('Transactions:', function() {
//     it('should generate a valid transaction signature', async function() {
//       const signatureData = 'abcd';
//       const tx = {
//         txHex: signatureData,
//         headers: {
//           ref_block_num: 1,
//           ref_block_prefix: 'asd',
//         },
//         transaction: {
//           signatures: [],
//           packed_trx: signatureData,
//           compression: 'none',
//         },
//         recipients: [{ }]
//       };

//       const seed = Buffer.from('c3b09c24731be2851b624d9d5b3f60fa129695c24071768d15654bea207b7bb6', 'hex');
//       const keyPair = basecoin.generateKeyPair(seed);
//       console.log(keyPair);
//       const { halfSigned } = await basecoin.signTransaction({ txPrebuild: tx, prv: keyPair.prv });
//       const signature = halfSigned.transaction.signatures[0];
//       const hdNode = bitcoin.HDNode.fromBase58(keyPair.pub);
//       const eosPubkey = ecc.PublicKey.fromBuffer(hdNode.getPublicKeyBuffer()).toString();
//       console.log(eosPubkey);
//       ecc.verify(signature, Buffer.from(signatureData, 'hex'), eosPubkey).should.eql(true);
//     });

//     it('should explain an EOS transaction', async function() {
//       const explainTransactionParams = {
//         headers: {
//           ref_block_prefix: 100,
//           ref_block_num: 995,
//           expiration: '2018-04-27T18:40:34.000Z',
//         },
//         transaction: {
//           packed_trx: 'a26ee35ae30364000000000000000100a6823403ea3055000000572d3ccdcd019013e48c8ce5eed400000000a8ed3232229013e48c8ce5eed4b012362b61b31236640000000000000004454f5300000000013100',
//         },
//       };

//       const explainedTx = await basecoin.explainTransaction(explainTransactionParams);
//       explainedTx.outputAmount.should.equal('100');
//       explainedTx.outputs.length.should.equal(1);
//       explainedTx.outputs[0].amount.should.equal('100');
//       explainedTx.outputs[0].address.should.equal('asdfasdfasdf');
//       explainedTx.id.should.equal('6132f3bf4a746e6ecad8a31df67d71b4741fc5b7c868ae36dde18309a91df8a6');
//       explainedTx.memo.should.equal('1');
//     });
//   });
// });

describe('Eos:', function () {
  let bitgo;
  let basecoin;
  const sender = EosResources.accounts.account1;
  const receiver = EosResources.accounts.account2;
  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('teos');
  });

  const createBaseBuilder = () => {
    const factory = accountLib.register('eos', accountLib.Eos.TransactionBuilderFactory);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const txBuilder = factory.getEosTransactionBuilder();
    txBuilder
      .testnet()
      .expiration('2019-09-19T16:39:15')
      .refBlockNum(100)
      .refBlockPrefix(100);
    return txBuilder;
  };

  it('should explain a transaction hex', async function () {
    const explain = await basecoin.explainTransaction({
      txHex: EosResources.transactions.transferTransaction.serializedTransaction,
      feeInfo: { fee: '0' },
    }) as EosTransactionExplanation;
    explain.outputs[0].address.should.equal(receiver.name);
    explain.outputs[0].amount.should.equal('1.0000 SYS');
    explain.outputs[0].memo?.should.equal('Some memo');
    explain.expiration?.should.equal('2019-09-19T16:39:15.000');
    explain.ref_block_num?.should.equal(100);
    explain.ref_block_prefix?.should.equal(100);
    explain.actions[0].name.should.equal('transfer');
  });

  it('should explain a transfer transaction', async function () {
    const txBuilder = createBaseBuilder();
    txBuilder
      .sign({ key: sender.privateKey });
    txBuilder
      .transferActionBuilder('eosio.token', [sender.name])
      .from(sender.name)
      .to(receiver.name)
      .quantity('1.0000 SYS')
      .memo('Some memo');
    txBuilder.sign({ key: EosResources.accounts.account3.privateKey });
    const tx = await txBuilder.build();
    const explain = await basecoin.explainTransaction({
      txHex: tx.toBroadcastFormat().serializedTransaction,
      feeInfo: { fee: '0' },
    }) as EosTransactionExplanation;
    explain.outputs[0].address.should.equal(receiver.name);
    explain.outputs[0].amount.should.equal('1.0000 SYS');
    explain.outputs[0].memo?.should.equal('Some memo');
    explain.expiration?.should.equal('2019-09-19T16:39:15.000');
    explain.ref_block_num?.should.equal(100);
    explain.ref_block_prefix?.should.equal(100);
    explain.actions[0].name.should.equal('transfer');
  });

  it('should explain a powerup transaction', async function () {
    const txBuilder = createBaseBuilder();
    txBuilder
      .testnet()
      .expiration('2019-09-19T16:39:15')
      .refBlockNum(100)
      .refBlockPrefix(100)
      .sign({ key: sender.privateKey });
    txBuilder
      .powerupActionBuilder('eosio', [sender.name])
      .payer(sender.name)
      .receiver(receiver.name)
      .days(1)
      .netFrac('2000000000')
      .cpuFrac('8000000000')
      .maxPayment('10.0000 EOS');
    txBuilder.sign({ key: EosResources.accounts.account3.privateKey });
    const tx = await txBuilder.build();
    const explain = await basecoin.explainTransaction({
      txHex: tx.toBroadcastFormat().serializedTransaction,
      feeInfo: { fee: '0' },
    }) as EosTransactionExplanation;
    explain.expiration?.should.equal('2019-09-19T16:39:15.000');
    explain.ref_block_num?.should.equal(100);
    explain.ref_block_prefix?.should.equal(100);
    explain.actions[0].name.should.equal('powerup');
  });
});
