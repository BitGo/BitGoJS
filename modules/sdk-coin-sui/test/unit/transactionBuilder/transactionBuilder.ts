import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { SuiTransactionType } from '../../../src/lib/iface';
import { recipients, STAKING_AMOUNT } from '../../resources/sui';
import { KeyPair } from '../../../src/lib/keyPair';
import { GasData } from '../../../src/lib/mystenlab/types';
import axios from 'axios';
import { TransferTransaction } from '../../../src';
import { test } from 'mocha';
import {toB58, toB64} from '@mysten/bcs';

describe('Sui Transaction Builder', async () => {
  let builders;
  const factory = getBuilderFactory('tsui');

  describe('Transfer TX', async () => {
    beforeEach(function (done) {
      builders = [factory.getTransferBuilder()];
      done();
    });

    it('should build a transfer transaction and serialize it and deserialize it', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(recipients);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.TRANSFER);
      const reserialized = await factory.from(rawTx).build();
      reserialized.should.be.deepEqual(tx);
      reserialized.toBroadcastFormat().should.equal(rawTx);
    });

    it('should build and sign a transfer tx with gasPayment', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(recipients);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();
      should.equal(tx.id, 'UNAVAILABLE');
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.TRANSFER);

      const txBuilder2 = await factory.from(rawTx);
      await txBuilder2.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const signedTx = await txBuilder2.build();
      should.equal(signedTx.type, TransactionType.Send);
      should.equal(signedTx.id, 'BxoeGXbBCuw6VFEcgwHHUAKrCoAsGanPB39kdVVKZZcR');

      const rawSignedTx = signedTx.toBroadcastFormat();
      should.equal(rawSignedTx, testData.TRANSFER);
      const reserializedTxBuilder = factory.from(rawSignedTx);
      reserializedTxBuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const reserialized = await reserializedTxBuilder.build();

      reserialized.should.be.deepEqual(signedTx);
      reserialized.toBroadcastFormat().should.equal(rawSignedTx);
    });

    it('should submit a transaction with private keys', async () => {
      const keyPair = new KeyPair({ prv: testData.privateKeys.prvKey1 });
      // const keyPair2 = new KeyPair({ prv: testData.privateKeys.prvKey2 });
      const senderAddress = keyPair.getAddress();
      // const receiveAddress = keyPair2.getAddress();
      const receiveAddress = '0x900742bb923ea906a56f325a17597752ecd3ac3026bba96e0edff45de8db33ab';
      console.log(senderAddress);

      const coinsRes = await axios.post('https://rpc.testnet.sui.io:443', {
        jsonrpc: '2.0',
        id: 1,
        method: 'suix_getCoins',
        params: [senderAddress],
      });
      const coins = coinsRes.data.result.data.map((r) => ({
        digest: r.digest,
        objectId: r.coinObjectId,
        version: r.version,
      }));
      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(senderAddress);
      txBuilder.send([{ address: receiveAddress, amount: '100000000' }]);
      const gasData: GasData = {
        payment: coins,
        owner: senderAddress,
        budget: testData.GAS_BUDGET,
        price: 1000,
      };
      txBuilder.gasData(gasData);
      // txBuilder.sign({ key: keyPair.getKeys().prv });
      txBuilder.sign({ key: testData.privateKeys.prvKey1 });
      const tx = await txBuilder.build() as TransferTransaction;

      const signable = tx.signablePayload.toString('hex');
      should.equal(signable, '27fb674cf584e4a1c44f9ab0ec9d186ef90401eca373a3b303d1214bd8311de5');

      const rawTx = tx.toBroadcastFormat();
      const rawSig = toB64(tx.serializedSig);
      // txBuilder.addSignature({ pub: keyPair.getKeys().pub }, Buffer.from(signature));
      // const signedtx = (await txBuilder.build()) as TransferTransaction;
      // const txHex = signedtx.toBroadcastFormat();

      // const sig = Buffer.from(rawTx.serializedSig).toString('base64');
      // console.log(txHex);
      // console.log(sig);

      should.equal(
        rawTx,
        'AAACAAgA4fUFAAAAAAAgkAdCu5I+qQalbzJaF1l3UuzTrDAmu6luDt/0XejbM6sCAgABAQAAAQECAAABAQCQB0K7kj6pBqVvMloXWXdS7NOsMCa7qW4O3/Rd6NszqwKcygOUfJcKNBI9ljXgFAHbfDNvwz4UYEm3dYYH1Tt7jWQEAAAAAAAAIG7h+bmoAO1WrNm6n83PnBoQLU87y6T1X4pLmY/9PHN0re30UDCFIItAssvAa8KsUfKeiXYSz9MwPZ7rx2aHV7JjBAAAAAAAACB46n1hO1ub4NYXPGakbh/guyTGsLuQhsiQYqf9Tvxz/5AHQruSPqkGpW8yWhdZd1Ls06wwJrupbg7f9F3o2zOr6AMAAAAAAACAlpgAAAAAAAA='
      );
      should.equal(
        rawSig,
        'AGhC/bmEKZ5oTb1Z91CnYEHrrzbrWV9RidxP0Tv3U/lgd5/egej0gJgDmeHmmP55Y44QtnAuy7L/NPjThY6NzQulzaq1j4wMuCiXuFW4ojFfuoBhEiBy/K4eB5BkHZ+eZw=='
      );
      // const submitRes = await axios.post('https://rpc.testnet.sui.io:443', {
      //   jsonrpc: '2.0',
      //   id: 1,
      //   method: 'sui_executeTransactionBlock',
      //   params: [
      //     rawTx,
      //     [rawSig],
      //     {
      //       showEffects: true,
      //     },
      //     'WaitForEffectsCert',
      //   ],
      // });
      // console.log(submitRes.data);
    });

    it('should fail to build if missing type', async function () {
      for (const txBuilder of builders) {
        txBuilder.sender(testData.sender.address);
        txBuilder.send(recipients);
        txBuilder.gasData(testData.gasData);
        await txBuilder.build().should.rejectedWith('type is required before building');
      }
    });

    it('should fail to build if missing sender', async function () {
      for (const txBuilder of builders) {
        txBuilder.type(SuiTransactionType.Transfer);
        txBuilder.send(recipients);
        txBuilder.gasData(testData.gasData);
        await txBuilder.build().should.rejectedWith('sender is required before building');
      }
    });

    it('should fail to build if missing recipients', async function () {
      for (const txBuilder of builders) {
        txBuilder.type(SuiTransactionType.Transfer);
        txBuilder.sender(testData.sender.address);
        txBuilder.gasData(testData.gasData);
        await txBuilder.build().should.rejectedWith('at least one recipient is required before building');
      }
    });

    it('should fail to build if missing gasData', async function () {
      for (const txBuilder of builders) {
        txBuilder.type(SuiTransactionType.Transfer);
        txBuilder.sender(testData.sender.address);
        txBuilder.send(recipients);
        await txBuilder.build().should.rejectedWith('gasData is required before building');
      }
    });

    it('should fail to build if missing payment coins in gasData', async function () {
      for (const txBuilder of builders) {
        txBuilder.type(SuiTransactionType.Transfer);
        txBuilder.sender(testData.sender.address);
        txBuilder.send(recipients);
        should(() => txBuilder.gasData(testData.gasDataWithoutGasPayment)).throwError(
          `gas payment is required before building`
        );
        await txBuilder.build().should.rejectedWith('gasData is required before building');
      }
    });

    it('should build a send from rawTx', async function () {
      const txBuilder = factory.from(testData.TRANSFER);
      const builtTx = await txBuilder.build();
      should.equal(builtTx.type, TransactionType.Send);
      should.equal(builtTx.id, 'BxoeGXbBCuw6VFEcgwHHUAKrCoAsGanPB39kdVVKZZcR');
      builtTx.inputs.length.should.equal(1);
      builtTx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: (testData.AMOUNT * 2).toString(),
        coin: 'tsui',
      });
      builtTx.outputs.length.should.equal(2);
      builtTx.outputs[0].should.deepEqual({
        address: testData.recipients[0].address,
        value: testData.recipients[0].amount,
        coin: 'tsui',
      });
      builtTx.outputs[1].should.deepEqual({
        address: testData.recipients[1].address,
        value: testData.recipients[1].amount,
        coin: 'tsui',
      });
      const jsonTx = builtTx.toJson();
      jsonTx.gasData.should.deepEqual(testData.gasData);
      jsonTx.kind.ProgrammableTransaction.should.deepEqual({
        inputs: testData.txInputs,
        transactions: testData.txTransactions,
      });
      jsonTx.sender.should.equal(testData.sender.address);
      jsonTx.gasData.should.deepEqual(testData.gasData);
      builtTx.toBroadcastFormat().should.equal(testData.TRANSFER);
    });
  });
  describe('Staking TX', async () => {
    beforeEach(function (done) {
      builders = [factory.getStakingBuilder()];
      done();
    });

    it('should build an add staking transaction and serialize it and deserialize it', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake(testData.requestAddStake);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.StakingAdd);
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.ADD_STAKE);
      const reserialized = await factory.from(rawTx).build();
      // reserialized.should.be.deepEqual(tx);
      reserialized.toBroadcastFormat().should.equal(rawTx);
    });

    it('should build and sign a staking tx with gasPayment', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake(testData.requestAddStake);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();
      should.equal(tx.id, 'bP78boZ48sDdJsg2V1tJahpGyBwaC9GSTL2rvyADnsh');
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.ADD_STAKE);

      const txBuilder2 = await factory.from(rawTx);
      await txBuilder2.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const signedTx = await txBuilder2.build();
      should.equal(signedTx.type, TransactionType.StakingAdd);
      should.equal(signedTx.id, 'bP78boZ48sDdJsg2V1tJahpGyBwaC9GSTL2rvyADnsh');

      const rawSignedTx = signedTx.toBroadcastFormat();
      should.equal(rawSignedTx, testData.ADD_STAKE);
      const reserializedTxBuilder = factory.from(rawSignedTx);
      reserializedTxBuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const reserialized = await reserializedTxBuilder.build();

      reserialized.should.be.deepEqual(signedTx);
      reserialized.toBroadcastFormat().should.equal(rawSignedTx);
    });

    it('should fail to build if missing type', async function () {
      for (const txBuilder of builders) {
        txBuilder.sender(testData.sender.address);
        txBuilder.stake(testData.requestAddStake);
        txBuilder.gasData(testData.gasData);
        await txBuilder.build().should.rejectedWith('type is required before building');
      }
    });

    it('should fail to build if missing sender', async function () {
      for (const txBuilder of builders) {
        txBuilder.type(SuiTransactionType.AddStake);
        txBuilder.stake(testData.requestAddStake);
        txBuilder.gasData(testData.gasData);
        await txBuilder.build().should.rejectedWith('sender is required before building');
      }
    });

    it('should fail to build if missing gasData', async function () {
      for (const txBuilder of builders) {
        txBuilder.sender(testData.sender.address);
        txBuilder.type(SuiTransactionType.AddStake);
        txBuilder.stake(testData.requestAddStake);
        await txBuilder.build().should.rejectedWith('gasData is required before building');
      }
    });

    it('should fail to build if missing payment coins in gasData', async function () {
      for (const txBuilder of builders) {
        txBuilder.sender(testData.sender.address);
        txBuilder.type(SuiTransactionType.AddStake);
        txBuilder.stake(testData.requestAddStake);
        should(() => txBuilder.gasData(testData.gasDataWithoutGasPayment)).throwError(
          `gas payment is required before building`
        );
        await txBuilder.build().should.rejectedWith('gasData is required before building');
      }
    });

    it('should build a send from rawTx', async function () {
      const txBuilder = factory.from(testData.ADD_STAKE);
      const builtTx = await txBuilder.build();
      should.equal(builtTx.type, TransactionType.StakingAdd);
      should.equal(builtTx.id, 'bP78boZ48sDdJsg2V1tJahpGyBwaC9GSTL2rvyADnsh');
      builtTx.inputs.length.should.equal(1);
      builtTx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: STAKING_AMOUNT.toString(),
        coin: 'tsui',
      });
      builtTx.outputs.length.should.equal(1);
      builtTx.outputs[0].should.deepEqual({
        address: testData.requestAddStake.validatorAddress,
        value: STAKING_AMOUNT.toString(),
        coin: 'tsui',
      });
      const jsonTx = builtTx.toJson();
      jsonTx.gasData.should.deepEqual(testData.gasData);
      jsonTx.kind.ProgrammableTransaction.should.deepEqual({
        inputs: testData.txInputsAddStake,
        transactions: testData.txTransactionsAddStake,
      });
      jsonTx.sender.should.equal(testData.sender.address);
      jsonTx.gasData.should.deepEqual(testData.gasData);
      builtTx.toBroadcastFormat().should.equal(testData.ADD_STAKE);
    });
  });
});
