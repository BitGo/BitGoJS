import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/statics';
import { bufferCVFromString, someCV, standardPrincipalCV, uintCV } from '@stacks/transactions';
import should from 'should';
import { StacksMainnet, StacksTestnet } from '@stacks/network';
import { TransactionType } from '@bitgo/sdk-core';
import assert from 'assert';

import { Sip10Token, StxLib } from '../../../src';
import { Transaction } from '../../../src/lib';
import * as testData from '../resources';

describe('Stacks: Fungible Token Transfer Builder', () => {
  const coinName = 'stx:sbtc';
  const coinNameTest = 'tstx:tsip6dp';
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('tstx:tsip6dp', Sip10Token.createInstance);
  });

  describe('Sip10 fungible token transfer builder', function () {
    const factory = new StxLib.TransactionBuilderFactory(coins.get(coinNameTest));
    const factoryProd = new StxLib.TransactionBuilderFactory(coins.get(coinName));

    const initTxBuilder = () => {
      const txBuilder = factory.getFungibleTokenTransferBuilder();
      txBuilder.fee({ fee: '180' });
      txBuilder.nonce(0);
      txBuilder.contractAddress(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.CONTRACT_ADDRESS);
      txBuilder.contractName(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.CONTRACT_NAME);
      txBuilder.functionName(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.FUNCTION_NAME);
      txBuilder.tokenName(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.TOKEN_NAME);
      return txBuilder;
    };

    describe('fungible token builder environment', function () {
      it('should select the right network', function () {
        should.equal(factory.getFungibleTokenTransferBuilder().coinName(), 'tstx:tsip6dp');
        should.equal(factoryProd.getFungibleTokenTransferBuilder().coinName(), 'stx:sbtc');
        // used type any to access protected properties
        const txBuilder: any = factory.getFungibleTokenTransferBuilder();
        const txBuilderProd: any = factoryProd.getFungibleTokenTransferBuilder();

        txBuilder._network.should.deepEqual(new StacksTestnet());
        txBuilderProd._network.should.deepEqual(new StacksMainnet());
      });
    });

    describe('should build', function () {
      it('an unsigned fungible token transfer transaction', async () => {
        const builder = initTxBuilder();
        builder.functionArgs([
          uintCV('10000'),
          standardPrincipalCV(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.SENDER_ADDRESS),
          standardPrincipalCV(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.RECEIVER_ADDRESS),
          someCV(bufferCVFromString('1')),
        ]);
        builder.fromPubKey(testData.TX_SENDER.pub);
        builder.numberSignatures(1);
        const tx = await builder.build();
        const stacksTxn = tx as Transaction;
        should.deepEqual(stacksTxn.stxTransaction.postConditions.values.length, 1);

        const txJson = tx.toJson();
        should.deepEqual(txJson.payload.contractAddress, testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.CONTRACT_ADDRESS);
        should.deepEqual(txJson.payload.contractName, 'tsip6dp-token');
        should.deepEqual(txJson.payload.functionName, 'transfer');
        should.deepEqual(txJson.nonce, 0);
        should.deepEqual(txJson.fee.toString(), '180');
        should.deepEqual(tx.toBroadcastFormat(), testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.UNSIGNED_SINGLE_SIG_TX);

        tx.type.should.equal(TransactionType.Send);
        tx.outputs.length.should.equal(1);
        tx.outputs[0].address.should.equal(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.RECEIVER_ADDRESS);
        tx.outputs[0].value.should.equal('10000');
        tx.inputs.length.should.equal(1);
        tx.inputs[0].address.should.equal(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.SENDER_ADDRESS);
        tx.inputs[0].value.should.equal('10000');
      });

      it('an unsigned fungible token transfer transaction without memo', async () => {
        const builder = initTxBuilder();
        builder.functionArgs([
          uintCV('10000'),
          standardPrincipalCV(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.SENDER_ADDRESS),
          standardPrincipalCV(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.RECEIVER_ADDRESS),
        ]);
        builder.fromPubKey(testData.TX_SENDER.pub);
        builder.numberSignatures(1);
        const tx = await builder.build();

        const txJson = tx.toJson();
        should.deepEqual(txJson.payload.contractAddress, testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.CONTRACT_ADDRESS);
        should.deepEqual(txJson.payload.contractName, 'tsip6dp-token');
        should.deepEqual(txJson.payload.functionName, 'transfer');
        should.deepEqual(txJson.nonce, 0);
        should.deepEqual(txJson.fee.toString(), '180');
        should.deepEqual(
          tx.toBroadcastFormat(),
          testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.UNSIGNED_SINGLE_SIG_TX_WITHOUT_MEMO
        );

        tx.type.should.equal(TransactionType.Send);
        tx.outputs.length.should.equal(1);
        tx.outputs[0].address.should.equal(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.RECEIVER_ADDRESS);
        tx.outputs[0].value.should.equal('10000');
        tx.inputs.length.should.equal(1);
        tx.inputs[0].address.should.equal(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.SENDER_ADDRESS);
        tx.inputs[0].value.should.equal('10000');
      });

      it('a multisig fungible token transfer transaction', async () => {
        const builder = initTxBuilder();
        builder.functionArgs([
          uintCV('10000'),
          standardPrincipalCV(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.SENDER_ADDRESS),
          standardPrincipalCV(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.RECEIVER_ADDRESS),
          someCV(bufferCVFromString('1')),
        ]);

        builder.sign({ key: testData.prv1 });
        builder.sign({ key: testData.prv2 });
        builder.fromPubKey([testData.pub1, testData.pub2, testData.pub3]);
        builder.numberSignatures(2);
        const tx = await builder.build();
        JSON.stringify(tx.toJson());
        should.deepEqual(tx.toBroadcastFormat(), testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.SIGNED_MULTI_SIG_TX);
      });
    });

    describe('should fail', () => {
      it('a fungible token transfer builder with an invalid key', () => {
        const builder = initTxBuilder();
        assert.throws(() => builder.sign({ key: 'invalidKey' }), /Unsupported private key/);
      });
      it('a fungible token transfer builder with an invalid contract address', () => {
        const builder = initTxBuilder();
        assert.throws(() => builder.contractAddress('invalidContractAddress'), /Invalid address/);
      });
      it('a fungible token transfer builder with an invalid contract function name', () => {
        const builder = initTxBuilder();
        assert.throws(
          () => builder.functionName('test-function'),
          new RegExp('test-function is not supported contract function name')
        );
      });
    });
  });
});
