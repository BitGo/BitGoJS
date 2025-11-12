import { coins } from '@bitgo/statics';
import { BuildTransactionError } from '@bitgo/sdk-core';
import * as assert from 'assert';
import { TransactionBuilderFactory } from '../../../src/lib/transactionBuilderFactory';
import { EXPORT_IN_C as testData } from '../../resources/transactionData/exportInC';

describe('ExportInCTxBuilder', function () {
  const factory = new TransactionBuilderFactory(coins.get('tflrp'));
  const txBuilder = factory.getExportInCBuilder();

  describe('utxos', function () {
    it('should throw an error when utxos are used', async function () {
      assert.throws(() => {
        txBuilder.utxos([]);
      }, new BuildTransactionError('utxos are not required in Export Tx in C-Chain'));
    });
  });

  describe('amount', function () {
    it('should accept valid amounts in different formats', function () {
      const validAmounts = [BigInt(1000), '1000', 1000];

      validAmounts.forEach((amount) => {
        assert.doesNotThrow(() => {
          txBuilder.amount(amount);
        });
      });
    });

    it('should throw error for invalid amounts', function () {
      const invalidAmounts = ['0', '-1'];

      invalidAmounts.forEach((amount) => {
        assert.throws(() => {
          txBuilder.amount(amount);
        }, BuildTransactionError);
      });
    });
  });

  describe('nonce', function () {
    it('should accept valid nonces in different formats', function () {
      const validNonces = [BigInt(1), '1', 1, 0];

      validNonces.forEach((nonce) => {
        assert.doesNotThrow(() => {
          txBuilder.nonce(nonce);
        });
      });
    });

    it('should throw error for negative nonce', function () {
      assert.throws(() => {
        txBuilder.nonce('-1');
      }, new BuildTransactionError('Nonce must be greater or equal than 0'));
    });
  });

  describe('to', function () {
    const txBuilder = factory.getExportInCBuilder();
    it('should accept multiple P-addresses', function () {
      const pAddresses = testData.pAddresses;
      assert.doesNotThrow(() => {
        txBuilder.to(pAddresses);
      });
    });
    it('should accept single P-address', function () {
      assert.doesNotThrow(() => {
        txBuilder.to(testData.pAddresses[0]);
      });
    });

    it('should accept tilde-separated P-addresses string', function () {
      const pAddresses = testData.pAddresses.join('~');

      assert.doesNotThrow(() => {
        txBuilder.to(pAddresses);
      });
    });
  });

  describe('should build a export txn from C to P', () => {
    const newTxBuilder = () =>
      factory
        .getExportInCBuilder()
        .fromPubKey(testData.cHexAddress)
        .nonce(testData.nonce)
        .amount(testData.amount)
        .threshold(testData.threshold)
        .locktime(10)
        .to(testData.pAddresses)
        .feeRate(testData.fee);

    it('Should create export tx for same values', async () => {
      const txBuilder = newTxBuilder();

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.unsignedTxHex);
    });
  });
});
