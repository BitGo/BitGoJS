import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, TransferBuilder, TransferTransaction } from '../../../src';
import * as testData from '../../resources/iota';
import { TransactionRecipient } from '@bitgo/sdk-core';
import { TransactionObjectInput } from '../../../src/lib/iface';
import should from 'should';

/**
 * Common test helpers and fixtures for IOTA transaction tests.
 * Reduces duplication and improves test readability.
 */

const factory = new TransactionBuilderFactory(coins.get('tiota'));

/**
 * Creates a basic transfer builder with sender, recipients, and payment objects.
 */
export function createBasicTransferBuilder(): TransferBuilder {
  return factory
    .getTransferBuilder()
    .sender(testData.sender.address)
    .recipients(testData.recipients)
    .paymentObjects(testData.paymentObjects);
}

/**
 * Creates a transfer builder with gas data for real (non-simulate) transactions.
 */
export function createTransferBuilderWithGas(): TransferBuilder {
  return createBasicTransferBuilder().gasData(testData.gasData);
}

/**
 * Creates a transfer builder with a gas sponsor.
 */
export function createTransferBuilderWithSponsor(): TransferBuilder {
  return createTransferBuilderWithGas().gasSponsor(testData.gasSponsor.address);
}

/**
 * Creates a builder with custom recipients.
 */
export function createBuilderWithRecipients(recipients: TransactionRecipient[]): TransferBuilder {
  return factory
    .getTransferBuilder()
    .sender(testData.sender.address)
    .recipients(recipients)
    .paymentObjects(testData.paymentObjects)
    .gasData(testData.gasData);
}

/**
 * Creates a builder that uses gas objects for payment (no payment objects).
 */
export function createBuilderWithGasObjectsOnly(): TransferBuilder {
  return factory
    .getTransferBuilder()
    .sender(testData.sender.address)
    .recipients(testData.recipients)
    .gasData(testData.gasData);
}

/**
 * Creates a builder with custom gas objects.
 */
export function createBuilderWithGasObjects(gasObjects: TransactionObjectInput[]): TransferBuilder {
  return factory.getTransferBuilder().sender(testData.sender.address).recipients(testData.recipients).gasData({
    gasBudget: testData.GAS_BUDGET,
    gasPrice: testData.GAS_PRICE,
    gasPaymentObjects: gasObjects,
  });
}

/**
 * Asserts that a transaction has the expected basic properties.
 */
export function assertBasicTransactionProperties(tx: TransferTransaction): void {
  should.exist(tx);
  should.equal(tx.sender, testData.sender.address);
  should.deepEqual(tx.recipients, testData.recipients);
  should.deepEqual(tx.paymentObjects, testData.paymentObjects);
}

/**
 * Asserts that a transaction has valid gas data.
 */
export function assertGasData(tx: TransferTransaction): void {
  should.equal(tx.gasBudget, testData.GAS_BUDGET);
  should.equal(tx.gasPrice, testData.GAS_PRICE);
  should.deepEqual(tx.gasPaymentObjects, testData.gasPaymentObjects);
}

/**
 * Asserts that a transaction has the expected inputs and outputs.
 */
export function assertInputsAndOutputs(tx: TransferTransaction, expectedRecipients: TransactionRecipient[]): void {
  const totalAmount = expectedRecipients.reduce((sum, r) => sum + Number(r.amount), 0);

  tx.inputs.length.should.equal(1);
  tx.inputs[0].should.deepEqual({
    address: testData.sender.address,
    value: totalAmount.toString(),
    coin: 'tiota',
  });

  tx.outputs.length.should.equal(expectedRecipients.length);
  expectedRecipients.forEach((recipient, index) => {
    tx.outputs[index].should.deepEqual({
      address: recipient.address,
      value: recipient.amount,
      coin: 'tiota',
    });
  });
}

/**
 * Verifies that a raw transaction is valid.
 */
export async function assertValidRawTransaction(tx: TransferTransaction): Promise<void> {
  const rawTx = await tx.toBroadcastFormat();
  should.exist(rawTx);
  should.equal(typeof rawTx, 'string');
  should.equal(rawTx.length > 0, true);
}

/**
 * Creates an array of recipients with the specified count and amount.
 */
export function createRecipients(count: number, amount = '1000'): TransactionRecipient[] {
  return Array.from({ length: count }, (_, i) => ({
    address: testData.addresses.validAddresses[i % testData.addresses.validAddresses.length],
    amount,
  }));
}

/**
 * Gets the transaction factory instance.
 */
export function getFactory(): TransactionBuilderFactory {
  return factory;
}

/**
 * Test data re-exports for convenience.
 */
export { testData };
