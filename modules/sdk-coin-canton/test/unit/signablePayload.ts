import assert from 'assert';
import { coins } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';

import { Transaction, WalletInitTransaction } from '../../src';
import { DUMMY_HASH } from '../../src/lib/constant';

describe('signablePayload', () => {
  const coinConfig = coins.get('tcanton');

  describe('Transaction', () => {
    it('should return extended payload when preparedTransaction is present', () => {
      const tx = new Transaction(coinConfig);
      tx.transactionType = TransactionType.Send;
      tx.prepareCommand = {
        preparedTransaction: Buffer.from('test-prepared-tx').toString('base64'),
        preparedTransactionHash: Buffer.from('test-hash-32-bytes-long-padding!').toString('base64'),
        hashingSchemeVersion: 'HASHING_SCHEME_VERSION_V2',
      };

      const payload = tx.signablePayload;

      // Parse the extended payload
      const itemCount = payload.readUInt32LE(0);
      assert.strictEqual(itemCount, 2);

      const txLen = payload.readUInt32LE(4);
      const preparedTxBuf = Buffer.from('test-prepared-tx');
      assert.strictEqual(txLen, preparedTxBuf.length);

      const extractedTx = payload.subarray(8, 8 + txLen);
      assert.deepStrictEqual(extractedTx, preparedTxBuf);

      const extractedHash = payload.subarray(8 + txLen);
      assert.deepStrictEqual(extractedHash, Buffer.from('test-hash-32-bytes-long-padding!'));

      // Verify total length: 4 (itemCount) + 4 (txLen) + preparedTx.length + hash.length
      assert.strictEqual(payload.length, 4 + 4 + preparedTxBuf.length + 32);
    });

    it('should throw when preparedTransaction is missing', () => {
      const tx = new Transaction(coinConfig);
      tx.transactionType = TransactionType.Send;
      tx.prepareCommand = {
        preparedTransaction: '',
        preparedTransactionHash: Buffer.from('test-hash-32-bytes-long-padding!').toString('base64'),
        hashingSchemeVersion: 'HASHING_SCHEME_VERSION_V2',
      };

      // Canton requires extended payload with preparedTransaction
      // Missing preparedTransaction indicates IMS error or corrupted data
      assert.throws(
        () => tx.signablePayload,
        /Missing preparedTransaction from IMS/,
        'Should throw error when preparedTransaction is missing'
      );
    });

    it('should return DUMMY_HASH for TransferAcknowledge', () => {
      const tx = new Transaction(coinConfig);
      tx.transactionType = TransactionType.TransferAcknowledge;

      const payload = tx.signablePayload;
      assert.deepStrictEqual(payload, Buffer.from(DUMMY_HASH, 'base64'));
    });

    it('should throw when prepareCommand is not set', () => {
      const tx = new Transaction(coinConfig);
      tx.transactionType = TransactionType.Send;

      assert.throws(() => tx.signablePayload, /Empty transaction data/);
    });

    it('should throw when preparedTransactionHash is missing', () => {
      const tx = new Transaction(coinConfig);
      tx.transactionType = TransactionType.Send;
      tx.prepareCommand = {
        preparedTransaction: Buffer.from('test-prepared-tx').toString('base64'),
        preparedTransactionHash: '',
        hashingSchemeVersion: 'HASHING_SCHEME_VERSION_V2',
      };

      assert.throws(() => tx.signablePayload, /Missing preparedTransactionHash/);
    });

    it('should throw when payload construction fails', () => {
      const tx = new Transaction(coinConfig);
      tx.transactionType = TransactionType.Send;
      tx.prepareCommand = {
        preparedTransaction: 'invalid-base64!!!',
        preparedTransactionHash: Buffer.from('test-hash-32-bytes-long-padding!').toString('base64'),
        hashingSchemeVersion: 'HASHING_SCHEME_VERSION_V2',
      };

      assert.throws(() => tx.signablePayload, /Failed to construct signing payload/);
    });
  });

  describe('WalletInitTransaction', () => {
    it('should return extended payload with topology transactions', () => {
      const tx = new WalletInitTransaction(coinConfig);
      const topoTx1 = Buffer.from('topology-tx-1');
      const topoTx2 = Buffer.from('topology-tx-2');
      const multiHash = Buffer.from('multi-hash-32-bytes-long-paddin!');

      tx.preparedParty = {
        partyId: 'test-party',
        publicKeyFingerprint: 'test-fingerprint',
        topologyTransactions: [topoTx1.toString('base64'), topoTx2.toString('base64')],
        multiHash: multiHash.toString('base64'),
      };

      const payload = tx.signablePayload;

      // Item count = 2 topology txs + 1 multiHash = 3
      const itemCount = payload.readUInt32LE(0);
      assert.strictEqual(itemCount, 3);

      // First topology tx
      let offset = 4;
      const len1 = payload.readUInt32LE(offset);
      assert.strictEqual(len1, topoTx1.length);
      offset += 4;
      assert.deepStrictEqual(payload.subarray(offset, offset + len1), topoTx1);
      offset += len1;

      // Second topology tx
      const len2 = payload.readUInt32LE(offset);
      assert.strictEqual(len2, topoTx2.length);
      offset += 4;
      assert.deepStrictEqual(payload.subarray(offset, offset + len2), topoTx2);
      offset += len2;

      // multiHash at the end
      assert.deepStrictEqual(payload.subarray(offset), multiHash);
    });

    it('should include txnType prefix when shouldIncludeTxnType is true', () => {
      const tx = new WalletInitTransaction(coinConfig);
      const topoTx = Buffer.from('topology-tx');
      const multiHash = Buffer.from('multi-hash-value');

      tx.preparedParty = {
        partyId: 'test-party',
        publicKeyFingerprint: 'test-fingerprint',
        topologyTransactions: [topoTx.toString('base64')],
        multiHash: multiHash.toString('base64'),
        shouldIncludeTxnType: true,
      };

      const payload = tx.signablePayload;

      // First 4 bytes: txnType = 0
      const txnType = payload.readUInt32LE(0);
      assert.strictEqual(txnType, 0);

      // Next 4 bytes: item count = 2 (1 topo + 1 multiHash)
      const itemCount = payload.readUInt32LE(4);
      assert.strictEqual(itemCount, 2);

      // Topology tx with length prefix
      const len = payload.readUInt32LE(8);
      assert.strictEqual(len, topoTx.length);
      assert.deepStrictEqual(payload.subarray(12, 12 + len), topoTx);

      // multiHash at the end
      assert.deepStrictEqual(payload.subarray(12 + len), multiHash);
    });

    it('should throw when topologyTransactions is empty', () => {
      const tx = new WalletInitTransaction(coinConfig);
      const multiHash = Buffer.from('multi-hash-value');

      tx.preparedParty = {
        partyId: 'test-party',
        publicKeyFingerprint: 'test-fingerprint',
        topologyTransactions: [],
        multiHash: multiHash.toString('base64'),
      };

      // Canton requires extended payload with topology transactions for wallet initialization
      // Empty topology transactions indicates IMS error or party misconfiguration
      assert.throws(
        () => tx.signablePayload,
        /Missing or empty topologyTransactions from IMS/,
        'Should throw error when topologyTransactions is empty'
      );
    });

    it('should throw when preparedParty is not set', () => {
      const tx = new WalletInitTransaction(coinConfig);

      assert.throws(() => tx.signablePayload, /Empty transaction data/);
    });

    it('should throw when multiHash is missing', () => {
      const tx = new WalletInitTransaction(coinConfig);
      const topoTx = Buffer.from('topology-tx');

      tx.preparedParty = {
        partyId: 'test-party',
        publicKeyFingerprint: 'test-fingerprint',
        topologyTransactions: [topoTx.toString('base64')],
        multiHash: '',
      };

      assert.throws(() => tx.signablePayload, /Missing multiHash/);
    });

    it('should throw when topology transaction has invalid base64', () => {
      const tx = new WalletInitTransaction(coinConfig);
      const multiHash = Buffer.from('multi-hash-value');

      tx.preparedParty = {
        partyId: 'test-party',
        publicKeyFingerprint: 'test-fingerprint',
        topologyTransactions: ['invalid-base64!!!'],
        multiHash: multiHash.toString('base64'),
      };

      assert.throws(() => tx.signablePayload, /Failed to decode topology transaction/);
    });
  });
});
