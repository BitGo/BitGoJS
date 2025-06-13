import { TransactionBuilderFactory, Transaction } from '../../src';
import { coins } from '@bitgo/statics';
import * as testData from '../resources/vet';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';

describe('Vet Transfer Transaction', () => {
  const factory = new TransactionBuilderFactory(coins.get('tvet'));

  describe('Vet Coin Transfer Transaction', () => {
    describe('Succeed', () => {
      it('should build a transfer tx', async function () {
        const transaction = new Transaction(coins.get('tvet'));
        const txBuilder = factory.getTransferBuilder(transaction);
        txBuilder.sender(testData.addresses.validAddresses[0]);
        txBuilder.recipients(testData.recipients);
        txBuilder.gas(21000);
        txBuilder.nonce(64248);
        txBuilder.blockRef('0x014ead140e77bbc1');
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.expiration(64);
        txBuilder.gasPriceCoef(128);
        const tx = (await txBuilder.build()) as Transaction;
        should.equal(tx.sender, testData.addresses.validAddresses[0]);
        should.equal(tx.recipients[0].address, testData.recipients[0].address);
        should.equal(tx.recipients[0].amount, testData.recipients[0].amount);
        should.equal(tx.gas, 21000);
        should.equal(tx.getFee(), '315411764705882352');
        should.equal(tx.nonce, 64248);
        should.equal(tx.expiration, 64);
        should.equal(tx.type, TransactionType.Send);
        tx.inputs.length.should.equal(1);
        tx.inputs[0].should.deepEqual({
          address: testData.addresses.validAddresses[0],
          value: testData.recipients[0].amount,
          coin: 'tvet',
        });
        tx.outputs.length.should.equal(1);
        tx.outputs[0].should.deepEqual({
          address: testData.recipients[0].address,
          value: testData.recipients[0].amount,
          coin: 'tvet',
        });
        const rawTx = tx.toBroadcastFormat();
        should.equal(txBuilder.isValidRawTransaction(rawTx), true);
        rawTx.should.equal(testData.UNSIGNED_TRANSACTION_2);
      });

      it('should build and send a signed tx', async function () {
        const txBuilder = factory.from(testData.SPONSORED_TRANSACTION);
        txBuilder.getNonce().should.equal(186037);

        const tx = (await txBuilder.build()) as Transaction;
        should.equal(tx.type, TransactionType.Send);
        tx.inputs.length.should.equal(1);
        tx.inputs[0].should.deepEqual({
          address: testData.addresses.validAddresses[0],
          value: testData.AMOUNT.toString(),
          coin: 'tvet',
        });
        tx.outputs.length.should.equal(1);
        tx.outputs[0].should.deepEqual({
          address: testData.recipients[0].address,
          value: testData.AMOUNT.toString(),
          coin: 'tvet',
        });
        should.equal(tx.id, '0x6d842d5dc5d59d4e8f0a8ec2757b430d1f19c06766fbc5b3db5ebac8a067a439');
        should.equal(tx.gas, 21000);
        should.equal(tx.getFee(), '315411764705882352');
        should.equal(tx.nonce, 186037);
        should.equal(tx.expiration, 64);
        should.equal(tx.type, TransactionType.Send);
        const rawTx = tx.toBroadcastFormat();
        should.equal(txBuilder.isValidRawTransaction(rawTx), true);
        should.equal(rawTx, testData.SPONSORED_TRANSACTION);
      });

      it('should succeed to validate a valid signablePayload', async function () {
        const transaction = new Transaction(coins.get('tvet'));
        const txBuilder = factory.getTransferBuilder(transaction);
        txBuilder.sender(testData.addresses.validAddresses[0]);
        txBuilder.recipients(testData.recipients);
        txBuilder.gas(21000);
        txBuilder.nonce(64248);
        txBuilder.expiration(64);
        txBuilder.blockRef('0x014ead140e77bbc1');
        txBuilder.gasPriceCoef(128);
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        const tx = (await txBuilder.build()) as Transaction;
        const signablePayload = tx.signablePayload;
        should.equal(
          signablePayload.toString('hex'),
          '90c5cd3e79059f65b32088c7d807b4c989c5c3051d5392827ec817ce2037c947'
        );
      });

      it('should build a unsigned tx and validate its toJson', async function () {
        const transaction = new Transaction(coins.get('tvet'));
        const txBuilder = factory.getTransferBuilder(transaction);
        txBuilder.sender(testData.addresses.validAddresses[0]);
        txBuilder.recipients(testData.recipients);
        txBuilder.gas(21000);
        txBuilder.nonce(64248);
        txBuilder.expiration(64);
        txBuilder.blockRef('0x014ead140e77bbc1');
        txBuilder.gasPriceCoef(128);
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        const tx = (await txBuilder.build()) as Transaction;
        const toJson = tx.toJson();
        should.equal(toJson.sender, testData.addresses.validAddresses[0]);
        should.deepEqual(toJson.recipients, [
          {
            address: testData.recipients[0].address,
            amount: testData.recipients[0].amount,
          },
        ]);
        should.equal(toJson.nonce, 64248);
        should.equal(toJson.gas, 21000);
        should.equal(toJson.gasPriceCoef, 128);
        should.equal(toJson.expiration, 64);
        should.equal(toJson.feePayer, testData.feePayer.address);
      });

      it('should build a signed tx and validate its toJson', async function () {
        const txBuilder = factory.from(testData.SPONSORED_TRANSACTION);
        const tx = (await txBuilder.build()) as Transaction;
        const toJson = tx.toJson();
        should.equal(toJson.id, '0x6d842d5dc5d59d4e8f0a8ec2757b430d1f19c06766fbc5b3db5ebac8a067a439');
        should.equal(toJson.sender, testData.addresses.validAddresses[0]);
        should.deepEqual(toJson.recipients, [
          {
            address: testData.addresses.validAddresses[1],
            amount: testData.AMOUNT.toString(),
          },
        ]);
        should.equal(toJson.nonce, 186037);
        should.equal(toJson.gas, 21000);
        should.equal(toJson.gasPriceCoef, 128);
        should.equal(toJson.expiration, 64);
      });
    });

    describe('Fail', () => {
      it('should fail for invalid sender', async function () {
        const transaction = new Transaction(coins.get('tvet'));
        const builder = factory.getTransferBuilder(transaction);
        should(() => builder.sender('randomString')).throwError('Invalid address randomString');
      });

      it('should fail for invalid recipient', async function () {
        const builder = factory.getTransferBuilder();
        should(() => builder.recipients([testData.invalidRecipients[0]])).throwError('Invalid address randomString');
        should(() => builder.recipients([testData.invalidRecipients[1]])).throwError('Value cannot be less than zero');
        should(() => builder.recipients([testData.invalidRecipients[2]])).throwError('Invalid amount format');
      });

      it('should fail for invalid gas amount', async function () {
        const builder = factory.getTransferBuilder();
        should(() => builder.gas(-1)).throwError('Value cannot be less than zero');
      });
    });
  });
});
