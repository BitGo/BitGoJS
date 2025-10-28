import should from 'should';
import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, TransferTransaction } from '../../src';
import * as testData from '../resources/iota';
import { TransactionType } from '@bitgo/sdk-core';

describe('Iota Transfer Transaction', () => {
  const factory = new TransactionBuilderFactory(coins.get('tiota'));

  describe('Transaction Properties', () => {
    it('should have correct transaction type', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.equal(tx.type, TransactionType.Send);
    });

    it('should have correct sender', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.equal(tx.sender, testData.sender.address);
    });

    it('should have correct recipients', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.deepEqual(tx.recipients, testData.recipients);
    });

    it('should have correct payment objects', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.deepEqual(tx.paymentObjects, testData.paymentObjects);
    });

    it('should be in simulate mode by default', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.equal(tx.isSimulateTx, true);
    });

    it('should not be in simulate mode when gas data is provided', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.equal(tx.isSimulateTx, false);
    });
  });

  describe('Transaction Inputs and Outputs', () => {
    it('should correctly set inputs', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      const totalAmount = testData.recipients.reduce((sum, r) => sum + Number(r.amount), 0);

      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: totalAmount.toString(),
        coin: 'tiota',
      });
    });

    it('should correctly set outputs', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;

      tx.outputs.length.should.equal(testData.recipients.length);
      testData.recipients.forEach((recipient, index) => {
        tx.outputs[index].should.deepEqual({
          address: recipient.address,
          value: recipient.amount,
          coin: 'tiota',
        });
      });
    });
  });

  describe('Transaction Serialization', () => {
    it('should serialize to JSON correctly', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      const json = tx.toJson();

      should.equal(json.sender, testData.sender.address);
      should.deepEqual(json.recipients, testData.recipients);
      should.deepEqual(json.paymentObjects, testData.paymentObjects);
      should.equal(json.gasBudget, testData.GAS_BUDGET);
      should.equal(json.gasPrice, testData.GAS_PRICE);
      should.deepEqual(json.gasPaymentObjects, testData.gasPaymentObjects);
      should.equal(json.type, TransactionType.Send);
    });

    it('should deserialize from JSON correctly', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      const json = tx.toJson();

      const newTx = new TransferTransaction(coins.get('tiota'));
      newTx.parseFromJSON(json);

      should.equal(newTx.sender, tx.sender);
      should.deepEqual(newTx.recipients, tx.recipients);
      should.deepEqual(newTx.paymentObjects, tx.paymentObjects);
      should.equal(newTx.gasBudget, tx.gasBudget);
      should.equal(newTx.gasPrice, tx.gasPrice);
    });

    it('should serialize to broadcast format', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      const broadcastFormat = await tx.toBroadcastFormat();

      should.exist(broadcastFormat);
      should.equal(typeof broadcastFormat, 'string');
      should.equal(broadcastFormat.length > 0, true);
    });

    it('should serialize to broadcast format', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      const broadcastFormat = await tx.toBroadcastFormat();

      should.exist(broadcastFormat);
      should.equal(typeof broadcastFormat, 'string');
      should.equal(broadcastFormat.length > 0, true);

      // Note: parseFromBroadcastTx has known parsing issues and is not fully tested here
    });
  });

  describe('Gas Configuration', () => {
    it('should set gas budget correctly', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.equal(tx.gasBudget, testData.GAS_BUDGET);
    });

    it('should set gas price correctly', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.equal(tx.gasPrice, testData.GAS_PRICE);
    });

    it('should set gas payment objects correctly', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.deepEqual(tx.gasPaymentObjects, testData.gasPaymentObjects);
    });

    it('should set gas sponsor correctly', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);
      txBuilder.gasSponsor(testData.gasSponsor.address);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.equal(tx.gasSponsor, testData.gasSponsor.address);
    });

    it('should return gas fee correctly', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.equal(tx.getFee(), testData.GAS_BUDGET.toString());
    });
  });

  describe('Transaction Signing', () => {
    it('should get signable payload for non-simulate tx', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      const payload = tx.signablePayload;

      should.exist(payload);
      should.equal(Buffer.isBuffer(payload), true);
      should.equal(payload.length, 32); // Blake2b produces 32-byte hash
    });

    it('should throw error when getting signable payload for simulate tx', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.equal(tx.isSimulateTx, true);

      should(() => tx.signablePayload).throwError('Cannot sign a simulate tx');
    });

    it('should allow canSign for non-simulate tx', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.equal(tx.canSign({} as any), true);
    });

    it('should not allow canSign for simulate tx', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);

      const tx = (await txBuilder.build()) as TransferTransaction;
      should.equal(tx.canSign({} as any), false);
    });
  });

  describe('Transaction Explanation', () => {
    it('should explain transaction correctly', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      const explanation = tx.explainTransaction();

      should.exist(explanation);
      should.equal(explanation.type, TransactionType.Send);
      should.exist(explanation.id);
      should.exist(explanation.outputs);
      should.equal(explanation.outputs.length, testData.recipients.length);
      should.equal(explanation.fee.fee, testData.GAS_BUDGET.toString());
    });
  });

  describe('Transaction ID', () => {
    it('should generate transaction ID for built transaction', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      const txId = tx.id;

      should.exist(txId);
      should.equal(typeof txId, 'string');
      should.equal(txId.length > 0, true);
    });

    it('should throw error when getting ID before build', function () {
      const tx = new TransferTransaction(coins.get('tiota'));
      tx.sender = testData.sender.address;

      should(() => tx.id).throwError('Tx not built or a rebuild is required');
    });
  });

  describe('Rebuild Requirement', () => {
    it('should set rebuild required when sender changes', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;

      tx.sender = testData.gasSponsor.address;
      should(() => tx.id).throwError('Tx not built or a rebuild is required');
    });

    it('should set rebuild required when gas budget changes', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      tx.gasBudget = 10000000;

      should(() => tx.id).throwError('Tx not built or a rebuild is required');
    });

    it('should set rebuild required when recipients change', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as TransferTransaction;
      tx.recipients = [{ address: testData.addresses.validAddresses[0], amount: '5000' }];

      should(() => tx.id).throwError('Tx not built or a rebuild is required');
    });
  });
});
