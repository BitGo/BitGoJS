import should from 'should';
import { fromBase64, toHex } from '@cosmjs/encoding';
import { TransactionType } from '@bitgo-beta/sdk-core';
import { getAvailableTestCoins, getBuilderFactory, getTestData } from '../../testUtils';

describe('Cosmos Transfer Builder', function () {
  const availableCoins = getAvailableTestCoins();
  // TODO: COIN-5039 -  Running tests for each coin in parallel to improve test performance
  // Loop through each available coin and run tests
  availableCoins.forEach((coinName) => {
    describe(`${coinName.toUpperCase()} Transfer Builder`, function () {
      const testData = getTestData(coinName);
      const factory = getBuilderFactory(testData.testnetCoin);
      const testTx = testData.testSendTx as Required<typeof testData.testSendTx>;
      const testTx2 = testData.testSendTx2 as Required<typeof testData.testSendTx2>;
      const testTxWithMemo = testData.testTxWithMemo as Required<typeof testData.testTxWithMemo>;
      const testSendManyTx = testData.testSendManyTx as Required<typeof testData.testSendManyTx>;
      it('should build a Transfer tx with signature', async function () {
        const txBuilder = factory.getTransferBuilder();
        txBuilder.sequence(testTx.sequence);
        txBuilder.gasBudget(testTx.gasBudget!);
        txBuilder.messages([testTx.sendMessage!.value]);
        txBuilder.publicKey(toHex(fromBase64(testTx.pubKey!)));
        txBuilder.addSignature({ pub: toHex(fromBase64(testTx.pubKey)) }, Buffer.from(testTx.signature, 'base64'));

        const tx = await txBuilder.build();
        const json = await (await txBuilder.build()).toJson();
        should.equal(tx.type, TransactionType.Send);
        should.deepEqual(json.gasBudget, testTx.gasBudget);
        should.deepEqual(json.sendMessages, [testTx.sendMessage]);
        should.deepEqual(json.publicKey, toHex(fromBase64(testTx.pubKey)));
        should.deepEqual(json.sequence, testTx.sequence);
        const rawTx = tx.toBroadcastFormat();
        should.equal(rawTx, testTx.signedTxBase64);
        should.deepEqual(tx.inputs, [
          {
            address: testTx.sender,
            value: testTx.sendMessage.value.amount[0].amount,
            coin: testData.testnetCoin,
          },
        ]);
        should.deepEqual(tx.outputs, [
          {
            address: testTx.sendMessage.value.toAddress,
            value: testTx.sendMessage.value.amount[0].amount,
            coin: testData.testnetCoin,
          },
        ]);
      });

      it('should build a Transfer tx with signature and memo', async function () {
        const txBuilder = factory.getTransferBuilder();
        txBuilder.sequence(testTxWithMemo.sequence);
        txBuilder.gasBudget(testTxWithMemo.gasBudget);
        txBuilder.messages([testTxWithMemo.sendMessage.value]);
        txBuilder.publicKey(toHex(fromBase64(testTxWithMemo.pubKey)));
        txBuilder.memo(testTxWithMemo.memo);
        txBuilder.addSignature(
          { pub: toHex(fromBase64(testTxWithMemo.pubKey)) },
          Buffer.from(testTxWithMemo.signature, 'base64')
        );

        const tx = await txBuilder.build();
        const json = await (await txBuilder.build()).toJson();
        should.equal(tx.type, TransactionType.Send);
        should.deepEqual(json.gasBudget, testTxWithMemo.gasBudget);
        should.deepEqual(json.sendMessages, [testTxWithMemo.sendMessage]);
        should.deepEqual(json.publicKey, toHex(fromBase64(testTxWithMemo.pubKey)));
        should.deepEqual(json.sequence, testTxWithMemo.sequence);
        should.equal(json.memo, testTxWithMemo.memo);
        const rawTx = tx.toBroadcastFormat();
        should.equal(rawTx, testTxWithMemo.signedTxBase64);
        should.deepEqual(tx.inputs, [
          {
            address: testTxWithMemo.sender,
            value: testTxWithMemo.sendMessage.value.amount[0].amount,
            coin: testData.testnetCoin,
          },
        ]);
        should.deepEqual(tx.outputs, [
          {
            address: testTxWithMemo.sendMessage.value.toAddress,
            value: testTxWithMemo.sendMessage.value.amount[0].amount,
            coin: testData.testnetCoin,
          },
        ]);
      });

      it('should build a Transfer tx without signature', async function () {
        const txBuilder = factory.getTransferBuilder();
        txBuilder.sequence(testTx.sequence);
        txBuilder.gasBudget(testTx.gasBudget);
        txBuilder.messages([testTx.sendMessage.value]);
        txBuilder.publicKey(toHex(fromBase64(testTx.pubKey)));
        const tx = await txBuilder.build();
        const json = await (await txBuilder.build()).toJson();
        should.equal(tx.type, TransactionType.Send);
        should.deepEqual(json.gasBudget, testTx.gasBudget);
        should.deepEqual(json.sendMessages, [testTx.sendMessage]);
        should.deepEqual(json.publicKey, toHex(fromBase64(testTx.pubKey)));
        should.deepEqual(json.sequence, testTx.sequence);
        tx.toBroadcastFormat();
        should.deepEqual(tx.inputs, [
          {
            address: testTx.sender,
            value: testTx.sendMessage.value.amount[0].amount,
            coin: testData.testnetCoin,
          },
        ]);
        should.deepEqual(tx.outputs, [
          {
            address: testTx.sendMessage.value.toAddress,
            value: testTx.sendMessage.value.amount[0].amount,
            coin: testData.testnetCoin,
          },
        ]);
      });

      it('should sign a Transfer tx', async function () {
        const txBuilder = factory.getTransferBuilder();
        txBuilder.sequence(testTx2.sequence);
        txBuilder.gasBudget(testTx2.gasBudget);
        txBuilder.messages([testTx2.sendMessage.value]);
        txBuilder.accountNumber(testTx2.accountNumber);
        txBuilder.chainId(testTx2.chainId);
        txBuilder.sign({ key: toHex(fromBase64(testTx2.privateKey)) });
        const tx = await txBuilder.build();
        const json = await (await txBuilder.build()).toJson();
        should.equal(tx.type, TransactionType.Send);
        should.deepEqual(json.gasBudget, testTx2.gasBudget);
        should.deepEqual(json.sendMessages, [testTx2.sendMessage]);
        should.deepEqual(json.publicKey, toHex(fromBase64(testTx2.pubKey)));
        should.deepEqual(json.sequence, testTx2.sequence);
        const rawTx = tx.toBroadcastFormat();
        should.equal(tx.signature[0], toHex(fromBase64(testTx2.signature)));

        should.equal(rawTx, testTx2.signedTxBase64);
        should.deepEqual(tx.inputs, [
          {
            address: testTx2.sender,
            value: testTx2.sendMessage.value.amount[0].amount,
            coin: testData.testnetCoin,
          },
        ]);
        should.deepEqual(tx.outputs, [
          {
            address: testTx2.sendMessage.value.toAddress,
            value: testTx2.sendMessage.value.amount[0].amount,
            coin: testData.testnetCoin,
          },
        ]);
      });

      it('should build a sendMany Transfer tx', async function () {
        const txBuilder = factory.getTransferBuilder();
        txBuilder.sequence(testSendManyTx.sequence);
        txBuilder.gasBudget(testSendManyTx.gasBudget);
        txBuilder.messages(testSendManyTx.sendMessages.map((msg) => msg.value));
        txBuilder.publicKey(toHex(fromBase64(testSendManyTx.pubKey)));
        txBuilder.chainId(testSendManyTx.chainId);
        txBuilder.accountNumber(testSendManyTx.accountNumber);
        txBuilder.memo(testSendManyTx.memo);
        txBuilder.addSignature(
          { pub: toHex(fromBase64(testSendManyTx.pubKey)) },
          Buffer.from(testSendManyTx.signature, 'base64')
        );

        const tx = await txBuilder.build();
        const json = await (await txBuilder.build()).toJson();
        should.equal(tx.type, TransactionType.Send);
        should.deepEqual(json.gasBudget, testSendManyTx.gasBudget);
        should.deepEqual(json.sendMessages, testSendManyTx.sendMessages);
        should.deepEqual(json.publicKey, toHex(fromBase64(testSendManyTx.pubKey)));
        should.deepEqual(json.sequence, testSendManyTx.sequence);
        should.deepEqual(
          tx.inputs,
          testSendManyTx.sendMessages.map((msg) => {
            return {
              address: msg.value.fromAddress,
              value: msg.value.amount[0].amount,
              coin: testData.testnetCoin,
            };
          })
        );
        should.deepEqual(
          tx.outputs,
          testSendManyTx.sendMessages.map((msg) => {
            return {
              address: msg.value.toAddress,
              value: msg.value.amount[0].amount,
              coin: testData.testnetCoin,
            };
          })
        );
        should.equal(tx.id, testSendManyTx.hash);
        const rawTx = tx.toBroadcastFormat();
        should.equal(rawTx, testSendManyTx.signedTxBase64);
      });
    });
  });
});
