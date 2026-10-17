import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/statics';
import { bufferCVFromString, noneCV, someCV, standardPrincipalCV, uintCV } from '@stacks/transactions';
import should from 'should';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
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

        txBuilder._network.should.deepEqual(STACKS_TESTNET);
        txBuilderProd._network.should.deepEqual(STACKS_MAINNET);
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

      it('a multisig fungible token transfer transaction with memo', async () => {
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

      it('a multisig fungible token transfer transaction without memo', async () => {
        const builder = initTxBuilder();
        builder.functionArgs([
          uintCV('10000'),
          standardPrincipalCV(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.SENDER_ADDRESS),
          standardPrincipalCV(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.RECEIVER_ADDRESS),
          noneCV(),
        ]);

        builder.sign({ key: testData.prv1 });
        builder.sign({ key: testData.prv2 });
        builder.fromPubKey([testData.pub1, testData.pub2, testData.pub3]);
        builder.numberSignatures(2);
        const tx = await builder.build();
        JSON.stringify(tx.toJson());
        should.deepEqual(
          tx.toBroadcastFormat(),
          testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.SIGNED_MULTI_SIG_TX_WITHOUT_MEMO
        );
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
      it('rejects PoX-5 functions', () => {
        const builder = initTxBuilder();
        assert.throws(
          () => builder.functionName('claim-rewards'),
          new RegExp('claim-rewards is not supported contract function name')
        );
      });
    });

    describe('fungible token transfer builder validation and mainnet post-condition', function () {
      it('rejects empty contract name and function name', function () {
        const builder = factory.getFungibleTokenTransferBuilder();
        assert.throws(() => builder.contractName(''), /Invalid name/);
        assert.throws(() => builder.functionName(''), /Invalid name/);
      });

      it('rejects fewer than three function args', function () {
        const builder = factory.getFungibleTokenTransferBuilder();
        assert.throws(() => builder.functionArgs([uintCV(1), uintCV(2)]), /Invalid number of arguments/);
      });

      it('builds a mainnet fungible token transfer with a mainnet post-condition address', async function () {
        const builder = factoryProd.getFungibleTokenTransferBuilder();
        builder.fee({ fee: '180' });
        builder.nonce(0);
        builder.contractAddress(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.CONTRACT_ADDRESS);
        builder.contractName(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.CONTRACT_NAME);
        builder.functionName(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.FUNCTION_NAME);
        builder.tokenName(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.TOKEN_NAME);
        builder.functionArgs([
          uintCV('10000'),
          standardPrincipalCV(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.SENDER_ADDRESS),
          standardPrincipalCV(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.RECEIVER_ADDRESS),
        ]);
        builder.fromPubKey(testData.TX_SENDER.pub);
        builder.numberSignatures(1);
        const tx = await builder.build();
        should.exist(tx.toBroadcastFormat());
      });

      it('fails the build for a contract that is not a known sip10 token', async function () {
        const builder = factory.getFungibleTokenTransferBuilder();
        builder.fee({ fee: '180' });
        builder.nonce(0);
        builder.contractAddress('ST000000000000000000002AMW42H');
        builder.contractName('not-a-token');
        builder.functionName('transfer');
        builder.functionArgs([
          uintCV('10000'),
          standardPrincipalCV(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.SENDER_ADDRESS),
          standardPrincipalCV(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.RECEIVER_ADDRESS),
        ]);
        builder.fromPubKey(testData.TX_SENDER.pub);
        builder.numberSignatures(1);
        // must fail at build time rather than emit an 'undefined' asset name that aborts on-chain
        await assert.rejects(builder.build(), /unknown fungible token contract/);
      });
    });

    describe('sBTC token transfer', function () {
      const sbtcContracts = [
        ['tstx:tsbtc', 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT'],
        ['stx:sbtc', 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4'],
      ] as const;

      for (const [coinName, contractAddress] of sbtcContracts) {
        it(`builds a ${coinName} transfer with a statics-resolved sbtc-token post-condition`, async function () {
          const sbtcFactory = new StxLib.TransactionBuilderFactory(coins.get(coinName));
          const builder = sbtcFactory.getFungibleTokenTransferBuilder();
          builder.fee({ fee: '180' });
          builder.nonce(0);
          builder.contractAddress(contractAddress);
          builder.contractName('sbtc-token');
          builder.functionName('transfer');
          builder.functionArgs([
            uintCV('10000'),
            standardPrincipalCV(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.SENDER_ADDRESS),
            standardPrincipalCV(testData.FUNGIBLE_TOKEN_TRANSFER_CONSTANTS.RECEIVER_ADDRESS),
          ]);
          builder.fromPubKey(testData.TX_SENDER.pub);
          builder.numberSignatures(1);

          const tx = await builder.build();

          // no explicit tokenName was set, so it must be resolved from statics
          const payload = (tx as Transaction).stxTransaction.payload as { contractName: { content: string } };
          should.equal(payload.contractName.content, 'sbtc-token');

          const postCondition = (tx as Transaction).stxTransaction.postConditions.values[0] as unknown as {
            asset: { contractName: { content: string }; assetName: { content: string } };
          };
          should.equal(postCondition.asset.contractName.content, 'sbtc-token');
          should.equal(postCondition.asset.assetName.content, 'sbtc-token');

          // rebuild from the serialized tx must be byte-identical (post-conditions preserved).
          // An unsigned single-sig tx carries no pubkey in its auth fields, so it is re-supplied
          // here — same pattern as the PoX-5/contract rebuild tests.
          const rebuilt = sbtcFactory.from(tx.toBroadcastFormat());
          rebuilt.fromPubKey(testData.TX_SENDER.pub);
          should.equal((await rebuilt.build()).toBroadcastFormat(), tx.toBroadcastFormat());
        });
      }
    });
  });
});
