import assert from 'assert';
import should from 'should';
import { StacksMainnet, StacksTestnet } from '@stacks/network';
import { TransactionType, rawPrvToExtendedKeys } from '@bitgo/sdk-core';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/statics';

import { Stx, Tstx, StxLib } from '../../../src';
import * as testData from '../resources';

const { KeyPair } = StxLib;

describe('Stacks: Send Many Builder', function () {
  const coinName = 'stx';
  const coinNameTest = 'tstx';
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('stx', Stx.createInstance);
    bitgo.safeRegister('tstx', Tstx.createInstance);
  });
  describe('Stx Transfer Builder', () => {
    const factory = new StxLib.TransactionBuilderFactory(coins.get(coinNameTest));
    const factoryProd = new StxLib.TransactionBuilderFactory(coins.get(coinName));

    const initTxBuilder = () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.fee({ fee: '180' });
      txBuilder.nonce(0);
      txBuilder.to(testData.TX_RECIEVER.address);
      txBuilder.amount('1000');
      return txBuilder;
    };

    describe('transfer builder environment', function () {
      it('should select the right network', function () {
        should.equal(factory.getTransferBuilder().coinName(), 'tstx');
        should.equal(factoryProd.getTransferBuilder().coinName(), 'stx');
        // used type any to access protected properties
        const txBuilder: any = factory.getTransferBuilder();
        const txBuilderProd: any = factoryProd.getTransferBuilder();

        txBuilder._network.should.deepEqual(new StacksTestnet());
        txBuilderProd._network.should.deepEqual(new StacksMainnet());
      });
    });

    describe('should build ', () => {
      it('a signed transfer transaction', async () => {
        const builder = initTxBuilder();
        builder.fromPubKey(testData.TX_SENDER.pub);
        builder.sign({ key: testData.TX_SENDER.prv });
        const tx = await builder.build();

        const txJson = tx.toJson();
        // should.deepEqual(tx.signature.length, 1);
        should.deepEqual(txJson.payload.to, testData.TX_RECIEVER.address);
        should.deepEqual(txJson.payload.amount, '1000');
        should.deepEqual(txJson.from, testData.TX_SENDER.address);
        should.deepEqual(txJson.nonce, 0);
        should.deepEqual(txJson.fee.toString(), '180');
        should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_TRANSACTION);
        tx.type.should.equal(TransactionType.Send);

        tx.outputs.length.should.equal(1);
        tx.outputs[0].address.should.equal(testData.TX_RECIEVER.address);
        tx.outputs[0].value.should.equal('1000');
        tx.inputs.length.should.equal(1);
        tx.inputs[0].address.should.equal(testData.TX_SENDER.address);
        tx.inputs[0].value.should.equal('1000');
      });

      it('a transfer transaction with memo', async () => {
        const builder = initTxBuilder();
        builder.fromPubKey(testData.TX_SENDER.pub);
        builder.memo('This is an example');
        builder.sign({ key: testData.TX_SENDER.prv });
        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.payload.to, testData.TX_RECIEVER.address);
        should.deepEqual(txJson.payload.amount, '1000');
        should.deepEqual(txJson.payload.memo, 'This is an example');
        should.deepEqual(txJson.from, testData.TX_SENDER.address);
        should.deepEqual(txJson.nonce, 0);
        should.deepEqual(txJson.fee.toString(), '180');
      });

      it('an unsigned multisig signed and verified', async () => {
        const destination = 'STDE7Y8HV3RX8VBM2TZVWJTS7ZA1XB0SSC3NEVH0';
        const amount = '1000';
        const memo = 'test';
        const kp = new KeyPair({ prv: '21d43d2ae0da1d9d04cfcaac7d397a33733881081f0b2cd038062cf0ccbb752601' });
        const kp1 = new KeyPair({ prv: 'c71700b07d520a8c9731e4d0f095aa6efb91e16e25fb27ce2b72e7b698f8127a01' });
        const kp2 = new KeyPair({ prv: 'e75dcb66f84287eaf347955e94fa04337298dbd95aa0dbb985771104ef1913db01' });
        const txBuilder = factory.getTransferBuilder();
        txBuilder.fee({
          fee: '180',
        });
        txBuilder.to(destination);
        txBuilder.amount(amount);
        txBuilder.nonce(1);
        txBuilder.fromPubKey([kp.getKeys().pub, kp1.getKeys().pub, kp2.getKeys().pub]);
        txBuilder.numberSignatures(2);
        txBuilder.memo(memo);
        const tx = await txBuilder.build(); // unsigned multisig tx

        const txBuilder2 = factory.getTransferBuilder();
        txBuilder2.from(tx.toBroadcastFormat());
        txBuilder2.sign({ key: '21d43d2ae0da1d9d04cfcaac7d397a33733881081f0b2cd038062cf0ccbb752601' });
        txBuilder2.sign({ key: 'c71700b07d520a8c9731e4d0f095aa6efb91e16e25fb27ce2b72e7b698f8127a01' });
        txBuilder.fromPubKey([kp.getKeys().pub, kp1.getKeys().pub, kp2.getKeys().pub]);
        const signedTx = await txBuilder2.build(); // signed multisig tx

        const txBuilder3 = factory.getTransferBuilder();
        txBuilder3.from(signedTx.toBroadcastFormat());
        const remake = await txBuilder3.build();
        should.deepEqual(remake.toBroadcastFormat(), signedTx.toBroadcastFormat());
      });

      it('an half signed tx', async () => {
        const destination = 'STDE7Y8HV3RX8VBM2TZVWJTS7ZA1XB0SSC3NEVH0';
        const amount = '1000';
        const memo = 'test';
        const kp = new KeyPair({ prv: '21d43d2ae0da1d9d04cfcaac7d397a33733881081f0b2cd038062cf0ccbb752601' });
        const kp1 = new KeyPair({ prv: 'c71700b07d520a8c9731e4d0f095aa6efb91e16e25fb27ce2b72e7b698f8127a01' });
        const kp2 = new KeyPair({ prv: 'e75dcb66f84287eaf347955e94fa04337298dbd95aa0dbb985771104ef1913db01' });
        const txBuilder = factory.getTransferBuilder();
        txBuilder.fee({
          fee: '180',
        });
        txBuilder.to(destination);
        txBuilder.amount(amount);
        txBuilder.nonce(1);
        txBuilder.sign({ key: '21d43d2ae0da1d9d04cfcaac7d397a33733881081f0b2cd038062cf0ccbb752601' });
        txBuilder.fromPubKey([kp.getKeys(true).pub, kp1.getKeys(true).pub, kp2.getKeys(true).pub]);
        txBuilder.numberSignatures(2);
        txBuilder.memo(memo);
        const tx = await txBuilder.build(); // half signed multisig tx
        should.deepEqual(tx.signature.length, 1);
        const txBuilder2 = factory.getTransferBuilder();
        txBuilder2.from(tx.toBroadcastFormat());
        txBuilder2.sign({ key: 'c71700b07d520a8c9731e4d0f095aa6efb91e16e25fb27ce2b72e7b698f8127a01' });
        txBuilder2.fromPubKey([kp.getKeys(true).pub, kp1.getKeys(true).pub, kp2.getKeys(true).pub]);
        const signedTx = await txBuilder2.build();
        should.deepEqual(
          signedTx.toBroadcastFormat(),
          '808000000004012fe507c09dbb23c3b7e5d166c81fc4b87692510b000000000000000100000000000000b4000000030201091538373641a50a4ebd6f653bb7b477489aceec50eff963072a838d2eaf50e4784c7c6d1490f57b899f0f04c215fce9176d9bb4ce19bfb07499c48878675a1f02008074202e04a7c777b4cdd26ad3fd35194311536113666d81a3840148e59eb43f274d88768ef1202d55633bfdcde8c6057932107354f406af6c378b6ea6b75d1a00038e3c4529395611be9abf6fa3b6987e81d402385e3d605a073f42f407565a4a3d000203020000000000051a1ae3f911d8f1d46d7416bfbe4b593fd41eac19cb00000000000003e874657374000000000000000000000000000000000000000000000000000000000000'
        );
        should.deepEqual(signedTx.signature.length, 2);
      });

      it('an half signed tx with xprv', async () => {
        const destination = 'STDE7Y8HV3RX8VBM2TZVWJTS7ZA1XB0SSC3NEVH0';
        const amount = '1000';
        const memo = 'test';
        const kp = new KeyPair({ prv: '21d43d2ae0da1d9d04cfcaac7d397a33733881081f0b2cd038062cf0ccbb752601' });
        const kp1 = new KeyPair({ prv: 'c71700b07d520a8c9731e4d0f095aa6efb91e16e25fb27ce2b72e7b698f8127a01' });
        const kp2 = new KeyPair({ prv: 'e75dcb66f84287eaf347955e94fa04337298dbd95aa0dbb985771104ef1913db01' });
        const txBuilder = factory.getTransferBuilder();
        txBuilder.fee({
          fee: '180',
        });
        txBuilder.to(destination);
        txBuilder.amount(amount);
        txBuilder.nonce(1);
        txBuilder.sign({ key: '21d43d2ae0da1d9d04cfcaac7d397a33733881081f0b2cd038062cf0ccbb752601' });
        txBuilder.fromPubKey([kp.getKeys(true).pub, kp1.getKeys(true).pub, kp2.getKeys(true).pub]);
        txBuilder.numberSignatures(2);
        txBuilder.memo(memo);
        const tx = await txBuilder.build(); // half signed multisig tx
        should.deepEqual(tx.signature.length, 1);
        const txBuilder2 = factory.getTransferBuilder();
        txBuilder2.from(tx.toBroadcastFormat());
        txBuilder2.fromPubKey([kp.getKeys(true).pub, kp1.getKeys(true).pub, kp2.getKeys(true).pub]);
        const extendedKey = rawPrvToExtendedKeys(kp1.getKeys(false).prv!);
        txBuilder2.sign({ key: extendedKey.xprv });
        const signedTx = await txBuilder2.build();
        should.deepEqual(
          signedTx.toBroadcastFormat(),
          '808000000004012fe507c09dbb23c3b7e5d166c81fc4b87692510b000000000000000100000000000000b4000000030201091538373641a50a4ebd6f653bb7b477489aceec50eff963072a838d2eaf50e4784c7c6d1490f57b899f0f04c215fce9176d9bb4ce19bfb07499c48878675a1f02008074202e04a7c777b4cdd26ad3fd35194311536113666d81a3840148e59eb43f274d88768ef1202d55633bfdcde8c6057932107354f406af6c378b6ea6b75d1a00038e3c4529395611be9abf6fa3b6987e81d402385e3d605a073f42f407565a4a3d000203020000000000051a1ae3f911d8f1d46d7416bfbe4b593fd41eac19cb00000000000003e874657374000000000000000000000000000000000000000000000000000000000000'
        );
        should.deepEqual(signedTx.signature.length, 2);
      });

      it('a multisig transfer transaction', async () => {
        const builder = initTxBuilder();
        builder.memo('test memo');
        builder.sign({ key: testData.prv1 });
        builder.sign({ key: testData.prv2 });
        builder.fromPubKey([testData.pub1, testData.pub2, testData.pub3]);
        const tx = await builder.build();
        should.deepEqual(tx.toBroadcastFormat(), testData.MULTI_SIG_SIGNED_TRANSACTION);
        should.deepEqual(tx.signature.length, 2);
      });

      it('a multisig serialized transfer transaction', async () => {
        const builder = factory.from(testData.MULTI_SIG_SIGNED_TRANSACTION);
        const tx = await builder.build();
        should.deepEqual(tx.toBroadcastFormat(), testData.MULTI_SIG_SIGNED_TRANSACTION);
      });

      it('a transfer transaction signed multiple times', async () => {
        const builder = initTxBuilder();
        builder.memo('test memo');
        builder.sign({ key: testData.prv1 });
        builder.sign({ key: testData.prv2 });
        builder.fromPubKey([testData.pub1, testData.pub2, testData.pub3]);
        builder.numberSignatures(2);
        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(tx.signature.length, 2);
        should.deepEqual(txJson.fee.toString(), '180');
        should.deepEqual(txJson.payload.to, testData.TX_RECIEVER.address);
        should.deepEqual(txJson.payload.memo, 'test memo');
        should.deepEqual(txJson.payload.amount, '1000');
      });

      it('a transfer transaction with amount 0', async () => {
        const builder = initTxBuilder();
        builder.amount('0');
        builder.fromPubKey(testData.TX_SENDER.pub);
        builder.sign({ key: testData.TX_SENDER.prv });
        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.payload.to, testData.TX_RECIEVER.address);
        should.deepEqual(txJson.payload.amount, '0');
        should.deepEqual(txJson.from, testData.TX_SENDER.address);
        should.deepEqual(txJson.fee.toString(), '180');
      });

      it('get pubkey of a transfer transaction signed 1', async () => {
        const txBuilder2: any = factory.getTransferBuilder();
        txBuilder2.from(testData.SIGNED_TRANSACTION_PK_1_3);
        should.deepEqual(txBuilder2._fromPubKeys, [testData.pub1, testData.pub2, testData.pub3]);
      });

      it('get pubkey of a transfer transaction signed 2', async () => {
        const txBuilder2: any = factory.getTransferBuilder();
        txBuilder2.from(testData.SIGNED_TRANSACTION_PK_2_3);
        should.deepEqual(txBuilder2._fromPubKeys, [testData.pub1, testData.pub2, testData.pub3]);
      });

      it('a transfer transaction signed multiple times with mid key no signer', async () => {
        const builder = initTxBuilder();
        builder.memo('test');
        builder.sign({ key: testData.prv1 });
        builder.fromPubKey([testData.pub1, testData.pub2, testData.pub3]);
        builder.numberSignatures(2);
        const tx = await builder.build();
        const txBuilder2 = factory.getTransferBuilder();
        txBuilder2.from(tx.toBroadcastFormat());
        txBuilder2.sign({ key: testData.prv3 });
        const signedTx = await txBuilder2.build();

        const txJson = signedTx.toJson();
        should.deepEqual(signedTx.toBroadcastFormat(), testData.SIGNED_TRANSACTION_PK_1_3);

        should.deepEqual(signedTx.signature.length, 2);
        should.deepEqual(txJson.fee.toString(), '180');
        should.deepEqual(txJson.payload.to, testData.TX_RECIEVER.address);
        should.deepEqual(txJson.payload.memo, 'test');
        should.deepEqual(txJson.payload.amount, '1000');
      });

      it('a transfer transaction signed multiple times with first key no signer', async () => {
        const builder = initTxBuilder();
        builder.memo('test');
        builder.sign({ key: testData.prv2 });
        builder.fromPubKey([testData.pub1, testData.pub2, testData.pub3]);
        builder.numberSignatures(2);
        const tx = await builder.build();
        const txBuilder2 = factory.getTransferBuilder();
        txBuilder2.from(tx.toBroadcastFormat());
        txBuilder2.sign({ key: testData.prv3 });
        const signedTx = await txBuilder2.build();

        const txJson = signedTx.toJson();
        should.deepEqual(signedTx.toBroadcastFormat(), testData.SIGNED_TRANSACTION_PK_2_3);

        should.deepEqual(signedTx.signature.length, 2);
        should.deepEqual(txJson.fee.toString(), '180');
        should.deepEqual(txJson.payload.to, testData.TX_RECIEVER.address);
        should.deepEqual(txJson.payload.memo, 'test');
        should.deepEqual(txJson.payload.amount, '1000');
      });

      describe('serialized transactions', () => {
        it('a non signed transfer transaction from serialized', async () => {
          const builder = factory.from(testData.RAW_TX_UNSIGNED);
          builder.sign({ key: testData.TX_SENDER.prv });
          const tx2 = await builder.build();
          should.deepEqual(tx2.toBroadcastFormat(), testData.SIGNED_TRANSACTION);
          tx2.type.should.equal(TransactionType.Send);
        });

        it('a signed transfer transaction from serialized', async () => {
          const txBuilder = factory.from(testData.SIGNED_TRANSACTION);
          const tx = await txBuilder.build();
          should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_TRANSACTION);
          tx.type.should.equal(TransactionType.Send);
        });

        it('a signed transfer transaction from serilaized 1', async () => {
          const txBuilder = factory.from(testData.SIGNED_TRANSACTION_PK_2_3);
          const tx = await txBuilder.build();
          should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_TRANSACTION_PK_2_3);
          tx.type.should.equal(TransactionType.Send);
        });

        it('a signed transfer transaction from serilaized 2', async () => {
          const txBuilder = factory.from(testData.SIGNED_TRANSACTION_PK_1_3);
          const tx = await txBuilder.build();
          should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_TRANSACTION_PK_1_3);
          tx.type.should.equal(TransactionType.Send);
        });
      });

      describe('should fail', () => {
        it('a transfer transaction with an invalid key', () => {
          const builder = initTxBuilder();
          assert.throws(() => builder.sign({ key: 'invalidKey' }), /Unsupported private key/);
        });

        it('a transfer transaction with an invalid destination address', () => {
          const txBuilder = factory.getTransferBuilder();
          assert.throws(() => txBuilder.to('invalidaddress'), /Invalid address/);
        });

        it('a transfer transaction with an invalid amount: text value', () => {
          const txBuilder = factory.getTransferBuilder();
          assert.throws(() => txBuilder.amount('invalidamount'), /Invalid amount/);
        });

        it('a transfer transaction with an invalid amount: negative value', () => {
          const txBuilder = factory.getTransferBuilder();
          assert.throws(() => txBuilder.amount('-5'), /Invalid amount/);
        });

        it('a transfer transaction with an invalid memo', async () => {
          const txBuilder = factory.getTransferBuilder();
          assert.throws(() => txBuilder.memo('This is a memo that is too long for a transaction'), /Memo is too long/);
        });
      });
    });
  });
});
