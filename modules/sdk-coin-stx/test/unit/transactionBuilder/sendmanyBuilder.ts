import should from 'should';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { pubKeyfromPrivKey, publicKeyToString } from '@stacks/transactions';
import { principalToString } from '@stacks/transactions/dist/clarity/types/principalCV';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/statics';

import { Stx, Tstx, StxLib } from '../../../src';
import * as testData from '../resources';

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

  describe('Stx Send Many Builder', () => {
    const factory = new StxLib.TransactionBuilderFactory(coins.get(coinNameTest));
    const factoryProd = new StxLib.TransactionBuilderFactory(coins.get(coinName));

    const initTxBuilder = () => {
      const txBuilder = factory.getSendmanyBuilder();
      txBuilder.fee({ fee: '532' });
      txBuilder.nonce(45);
      return txBuilder;
    };

    it('should select the right network', function () {
      should.equal(factory.getSendmanyBuilder().coinName(), 'tstx');
      should.equal(factoryProd.getSendmanyBuilder().coinName(), 'stx');
      // used type any to access protected properties
      const txBuilder: any = factory.getSendmanyBuilder();
      const txBuilderProd: any = factoryProd.getSendmanyBuilder();

      txBuilder._network.should.deepEqual(new StacksTestnet());
      txBuilderProd._network.should.deepEqual(new StacksMainnet());
    });

    describe('should build ', function () {
      it('a multisig send many transaction with memo', async () => {
        const builder = initTxBuilder();

        // corresponding public keys
        const pubKeys = testData.prvKeysString.map(pubKeyfromPrivKey);
        const pubKeyStrings = pubKeys.map(publicKeyToString);
        builder.fromPubKey(pubKeyStrings);
        for (const recipient of testData.sendManyRecipients) {
          builder.send(recipient);
        }
        builder.sign({ key: testData.prvKeysString[0] });
        builder.sign({ key: testData.prvKeysString[1] });
        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.id.should.equal('01793eeb993d15791ea9af8910d867407803fe4c7d1db2dac592a2e8200de12a');
        txJson.fee.should.equal('532');
        txJson.from.should.equal('SN3KT9DVM9TCTAHV0S9VEAKTDG7JBC0K26ZMWEBNT');
        txJson.nonce.should.equal(45);
        const { contractName, contractAddress, functionName, functionArgs } = txJson.payload;
        contractAddress.should.equal(testData.SEND_MANY_CONTRACT_ADDRESS_WITH_MEMO);
        contractName.should.equal(testData.SEND_MANY_CONTRACT_NAME_WITH_MEMO);
        functionName.should.equal(testData.SEND_MANY_CONTRACT_FUNCTION_NAME_WITH_MEMO);
        functionArgs.length.should.equal(1);
        functionArgs[0].should.have.property('list');
        const { list } = functionArgs[0];
        list.length.should.equal(testData.sendManyRecipients.length);
        for (let i = 0; i < testData.sendManyRecipients.length; i++) {
          list[i].data.should.have.properties(['to', 'ustx', 'memo']);
          principalToString(list[i].data.to).should.equal(testData.sendManyRecipients[i].address);
          list[i].data.memo.buffer.toString('ascii').should.equal(testData.sendManyRecipients[i].memo);
          list[i].data.ustx.value.should.equal(testData.sendManyRecipients[i].amount);
        }
        tx.outputs.length.should.equal(testData.sendManyRecipients.length);
        for (let i = 0; i < testData.sendManyRecipients.length; i++) {
          tx.outputs[i].address.should.equal(testData.sendManyRecipients[i].address);
          tx.outputs[i].value.should.equal(testData.sendManyRecipients[i].amount);
        }
        tx.inputs.length.should.equal(1);
        tx.inputs[0].address.should.equal('SN3KT9DVM9TCTAHV0S9VEAKTDG7JBC0K26ZMWEBNT');
        tx.inputs[0].value.should.equal('6000000');
        should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_SEND_MANY_WITH_MEMO);
      });

      it('a multisig send-many unsigned transfer transaction with memo from raw tx', async () => {
        const builder = factory.from(testData.UNSIGNED_SEND_MANY_WITH_MEMO);
        const tx = await builder.build();
        tx.toBroadcastFormat().should.equal(testData.UNSIGNED_SEND_MANY_WITH_MEMO);
      });

      it('a unsigned send-many signed transfer transaction with memo from raw tx', async () => {
        const builder = factory.from(testData.SIGNED_SEND_MANY_WITH_MEMO);
        const tx = await builder.build();
        tx.toBroadcastFormat().should.equal(testData.SIGNED_SEND_MANY_WITH_MEMO);
      });

      it('sign an unsigned tx from a raw tx', async () => {
        const builder = factory.from(testData.UNSIGNED_SEND_MANY_WITH_MEMO);
        builder.sign({ key: testData.prvKeysString[0] });
        builder.sign({ key: testData.prvKeysString[1] });
        const tx = await builder.build();
        tx.toBroadcastFormat().should.equal(testData.SIGNED_SEND_MANY_WITH_MEMO);
      });
    });
  });
});
