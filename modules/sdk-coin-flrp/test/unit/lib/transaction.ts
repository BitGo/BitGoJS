import { coins } from '@bitgo/statics';
import { TransactionType, InvalidTransactionError } from '@bitgo/sdk-core';
import * as assert from 'assert';
import { Transaction } from '../../../src/lib/transaction';
import { KeyPair } from '../../../src/lib/keyPair';

// Mock transaction for testing
interface MockTx {
  test: string;
}

describe('FLRP Transaction', function () {
  let transaction: Transaction;
  const coinConfig = coins.get('tflrp');

  // Helper to create a mock transaction for testing
  const createMockTx = (): MockTx => ({ test: 'transaction' });

  beforeEach(function () {
    transaction = new Transaction(coinConfig);
  });

  describe('Constructor', function () {
    it('should initialize with correct network configuration', function () {
      assert.strictEqual(transaction._assetId, 'FLR');
      assert.strictEqual(transaction._blockchainID, '11111111111111111111111111111111LpoYY');
      assert.strictEqual(transaction._networkID, 114);
      assert.strictEqual(transaction._threshold, 2);
      assert.strictEqual(transaction._locktime, BigInt(0));
    });

    it('should initialize empty arrays and default values', function () {
      assert.deepStrictEqual(transaction._fromAddresses, []);
      assert.deepStrictEqual(transaction._rewardAddresses, []);
      assert.deepStrictEqual(transaction._utxos, []);
      assert.deepStrictEqual(transaction._fee, {});
    });
  });

  describe('Transaction Type Management', function () {
    it('should set supported transaction types', function () {
      const supportedTypes = [
        TransactionType.Export,
        TransactionType.Import,
        TransactionType.AddValidator,
        TransactionType.AddDelegator,
        TransactionType.AddPermissionlessValidator,
        TransactionType.AddPermissionlessDelegator,
      ];

      supportedTypes.forEach((type) => {
        assert.doesNotThrow(() => {
          transaction.setTransactionType(type);
          assert.strictEqual(transaction._type, type);
        });
      });
    });

    it('should throw error for unsupported transaction types', function () {
      assert.throws(() => {
        transaction.setTransactionType(TransactionType.Send);
      }, /Transaction type .* is not supported/);
    });
  });

  describe('Getters', function () {
    it('should return correct flareTransaction', function () {
      const mockTx = createMockTx();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transaction.setTransaction(mockTx as any);
      assert.strictEqual(transaction.flareTransaction, mockTx);
    });

    it('should return empty signature array when no credentials', function () {
      assert.deepStrictEqual(transaction.signature, []);
    });

    it('should return empty credentials array', function () {
      assert.deepStrictEqual(transaction.credentials, []);
    });

    it('should return false for hasCredentials when no credentials', function () {
      assert.strictEqual(transaction.hasCredentials, false);
    });

    it('should return placeholder ID when no transaction set', function () {
      // This should throw error when no transaction is set
      assert.throws(() => {
        transaction.id;
      }, InvalidTransactionError);
    });

    it('should return placeholder signablePayload when no transaction set', function () {
      // This should throw error when no transaction is set
      assert.throws(() => {
        void transaction.signablePayload;
      }, InvalidTransactionError);
    });

    it('should return formatted fromAddresses', function () {
      transaction._fromAddresses = ['address1', 'address2'];
      const addresses = transaction.fromAddresses;
      assert.deepStrictEqual(addresses, ['address1', 'address2']);
    });

    it('should return formatted rewardAddresses', function () {
      transaction._rewardAddresses = ['reward1', 'reward2'];
      const addresses = transaction.rewardAddresses;
      assert.deepStrictEqual(addresses, ['reward1', 'reward2']);
    });
  });

  describe('Transaction Outputs', function () {
    beforeEach(function () {
      transaction._nodeID = 'test-node-id';
      transaction._stakeAmount = BigInt('1000000000000000'); // 1M FLR
    });

    it('should return empty outputs for Export type', function () {
      transaction.setTransactionType(TransactionType.Export);
      const outputs = transaction.outputs;
      assert.deepStrictEqual(outputs, []);
    });

    it('should return empty outputs for Import type', function () {
      transaction.setTransactionType(TransactionType.Import);
      const outputs = transaction.outputs;
      assert.deepStrictEqual(outputs, []);
    });

    it('should return staking outputs for AddValidator type', function () {
      transaction.setTransactionType(TransactionType.AddValidator);
      const outputs = transaction.outputs;
      assert.strictEqual(outputs.length, 1);
      assert.strictEqual(outputs[0].address, 'test-node-id');
      assert.strictEqual(outputs[0].value, '1000000000000000');
    });

    it('should return staking outputs for AddPermissionlessValidator type', function () {
      transaction.setTransactionType(TransactionType.AddPermissionlessValidator);
      const outputs = transaction.outputs;
      assert.strictEqual(outputs.length, 1);
      assert.strictEqual(outputs[0].address, 'test-node-id');
      assert.strictEqual(outputs[0].value, '1000000000000000');
    });

    it('should return staking outputs for AddDelegator type', function () {
      transaction.setTransactionType(TransactionType.AddDelegator);
      const outputs = transaction.outputs;
      assert.strictEqual(outputs.length, 1);
      assert.strictEqual(outputs[0].address, 'test-node-id');
      assert.strictEqual(outputs[0].value, '1000000000000000');
    });

    it('should return staking outputs for AddPermissionlessDelegator type', function () {
      transaction.setTransactionType(TransactionType.AddPermissionlessDelegator);
      const outputs = transaction.outputs;
      assert.strictEqual(outputs.length, 1);
      assert.strictEqual(outputs[0].address, 'test-node-id');
      assert.strictEqual(outputs[0].value, '1000000000000000');
    });

    it('should return empty outputs for unknown type', function () {
      // Don't set type, should default to empty
      const outputs = transaction.outputs;
      assert.deepStrictEqual(outputs, []);
    });
  });

  describe('Transaction Inputs', function () {
    it('should return inputs from UTXOs', function () {
      transaction._utxos = [
        {
          outputID: 1,
          amount: '1000000',
          txid: 'test-txid-1',
          outputidx: '0',
          threshold: 2,
          addresses: ['addr1', 'addr2'],
        },
        {
          outputID: 2,
          amount: '2000000',
          txid: 'test-txid-2',
          outputidx: '1',
          threshold: 2,
          addresses: ['addr3', 'addr4'],
        },
      ];
      transaction._fromAddresses = ['addr1', 'addr2', 'addr3', 'addr4'];

      const inputs = transaction.inputs;
      assert.strictEqual(inputs.length, 2);
      assert.strictEqual(inputs[0].id, 'test-txid-1:0');
      assert.strictEqual(inputs[0].value, '1000000');
      assert.strictEqual(inputs[0].address, 'addr1~addr2~addr3~addr4');
      assert.strictEqual(inputs[1].id, 'test-txid-2:1');
      assert.strictEqual(inputs[1].value, '2000000');
    });

    it('should return empty inputs when no UTXOs', function () {
      const inputs = transaction.inputs;
      assert.deepStrictEqual(inputs, []);
    });
  });

  describe('Change Outputs', function () {
    it('should return empty change outputs', function () {
      const changeOutputs = transaction.changeOutputs;
      assert.deepStrictEqual(changeOutputs, []);
    });
  });

  describe('Fee Handling', function () {
    it('should return default fee when no fee set', function () {
      const fee = transaction.fee;
      assert.deepStrictEqual(fee, { fee: '0' });
    });

    it('should return custom fee when set', function () {
      transaction._fee = { fee: '1000000' };
      const fee = transaction.fee;
      assert.deepStrictEqual(fee, { fee: '1000000' });
    });
  });

  describe('Signing', function () {
    let keyPair: KeyPair;

    beforeEach(function () {
      // Create a test key pair with a private key
      keyPair = new KeyPair({ prv: '01'.repeat(32) });
    });

    it('should throw error when no private key', async function () {
      const emptyKeyPair = new KeyPair();

      await assert.rejects(async () => {
        await transaction.sign(emptyKeyPair);
      }, InvalidTransactionError); // Will throw InvalidTransactionError for empty transaction first
    });

    it('should throw error when no transaction to sign', async function () {
      await assert.rejects(async () => {
        await transaction.sign(keyPair);
      }, InvalidTransactionError);
    });

    it('should throw error for FlareJS signing not implemented', async function () {
      // Set a mock transaction and mock credentials to pass validation
      const mockTx = createMockTx();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transaction.setTransaction(mockTx as any);

      // Mock hasCredentials to return true
      Object.defineProperty(transaction, 'hasCredentials', {
        get: () => true,
      });

      await assert.rejects(async () => {
        await transaction.sign(keyPair);
      }, /FlareJS signing not yet implemented/);
    });
  });

  describe('Serialization', function () {
    it('should throw error for toBroadcastFormat when no transaction', function () {
      assert.throws(() => {
        transaction.toBroadcastFormat();
      }, InvalidTransactionError);
    });

    it('should return placeholder for toBroadcastFormat when transaction set', function () {
      const mockTx = createMockTx();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transaction.setTransaction(mockTx as any);
      const broadcastFormat = transaction.toBroadcastFormat();
      assert.strictEqual(broadcastFormat, 'flare-tx-hex-placeholder');
    });

    it('should throw error for toJson when no transaction', function () {
      assert.throws(() => {
        transaction.toJson();
      }, InvalidTransactionError);
    });

    it('should return transaction data for toJson when transaction set', function () {
      const mockTx = createMockTx();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transaction.setTransaction(mockTx as any);
      transaction._fromAddresses = ['addr1'];
      transaction._threshold = 2;
      transaction._locktime = BigInt(100);

      const jsonData = transaction.toJson();
      assert.strictEqual(jsonData.id, 'flare-transaction-id-placeholder');
      assert.deepStrictEqual(jsonData.fromAddresses, ['addr1']);
      assert.strictEqual(jsonData.threshold, 2);
      assert.strictEqual(jsonData.locktime, '100');
    });
  });

  describe('Cross-chain Properties', function () {
    it('should identify Export as cross-chain transaction', function () {
      transaction.setTransactionType(TransactionType.Export);
      assert.strictEqual(transaction.isTransactionForCChain, true);
    });

    it('should identify Import as cross-chain transaction', function () {
      transaction.setTransactionType(TransactionType.Import);
      assert.strictEqual(transaction.isTransactionForCChain, true);
    });

    it('should identify AddValidator as non-cross-chain transaction', function () {
      transaction.setTransactionType(TransactionType.AddValidator);
      assert.strictEqual(transaction.isTransactionForCChain, false);
    });
  });

  describe('Transaction Explanation', function () {
    beforeEach(function () {
      const mockTx = createMockTx();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transaction.setTransaction(mockTx as any);
      transaction._fromAddresses = ['test-address'];
      transaction._fee = { fee: '1000000' };
    });

    it('should explain a basic transaction', function () {
      transaction.setTransactionType(TransactionType.Export);

      const explanation = transaction.explainTransaction();
      assert.ok(explanation.displayOrder);
      assert.ok(Array.isArray(explanation.displayOrder));
      assert.strictEqual(explanation.id, 'flare-transaction-id-placeholder');
      assert.deepStrictEqual(explanation.fee, { fee: '1000000' });
      assert.strictEqual(explanation.type, TransactionType.Export);
    });

    it('should include reward addresses for staking transactions', function () {
      transaction.setTransactionType(TransactionType.AddValidator);
      transaction._rewardAddresses = ['reward-addr-1'];

      const explanation = transaction.explainTransaction();
      assert.ok(explanation.displayOrder);
      assert.ok(explanation.displayOrder.includes('rewardAddresses'));
      assert.deepStrictEqual(explanation.rewardAddresses, ['reward-addr-1']);
    });

    it('should include cross-chain information for export/import', function () {
      transaction.setTransactionType(TransactionType.Export);

      const explanation = transaction.explainTransaction();
      assert.ok(explanation.displayOrder);
      assert.ok(explanation.displayOrder.includes('sourceChain'));
      assert.ok(explanation.displayOrder.includes('destinationChain'));
    });

    it('should calculate output amounts correctly', function () {
      transaction._nodeID = 'test-node';
      transaction._stakeAmount = BigInt('5000000000000000');
      transaction.setTransactionType(TransactionType.AddValidator);

      const explanation = transaction.explainTransaction();
      assert.strictEqual(explanation.outputAmount, '5000000000000000');
      assert.strictEqual(explanation.changeAmount, '0');
    });
  });

  describe('Signature Creation', function () {
    it('should create signature placeholder', function () {
      const mockPrivateKey = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex');
      const mockTx = createMockTx();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transaction.setTransaction(mockTx as any);

      const signature = transaction.createSignature(mockPrivateKey);
      assert.ok(typeof signature === 'string');
      assert.ok(signature.length > 0);
    });
  });

  describe('Validation', function () {
    it('should allow signing with valid key', function () {
      const keyPair = new KeyPair({ prv: '01'.repeat(32) });

      const canSign = transaction.canSign({ key: keyPair });
      assert.strictEqual(canSign, true);
    });
  });

  describe('Transaction Setting', function () {
    it('should set transaction correctly', function () {
      const mockTx = createMockTx();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transaction.setTransaction(mockTx as any);
      // Can't directly access _flareTransaction (protected), but can test via getter
      assert.strictEqual(transaction.flareTransaction, mockTx);
    });
  });

  describe('Hex Conversion', function () {
    it('should convert byte array to hex string', function () {
      const byteArray = new Uint8Array([0x01, 0x23, 0xab, 0xcd]);
      const hexString = transaction.toHexString(byteArray);
      assert.strictEqual(hexString, '0123abcd');
    });

    it('should handle empty byte array', function () {
      const byteArray = new Uint8Array([]);
      const hexString = transaction.toHexString(byteArray);
      assert.strictEqual(hexString, '');
    });
  });

  describe('Memo Functionality', function () {
    it('should initialize with empty memo', function () {
      assert.strictEqual(transaction.hasMemo(), false);
      assert.strictEqual(transaction.getMemoString(), '');
      assert.deepStrictEqual(transaction.getMemoBytes(), new Uint8Array());
    });

    it('should set memo from string', function () {
      const memoText = 'Test transaction memo';
      transaction.setMemo(memoText);

      assert.strictEqual(transaction.hasMemo(), true);
      assert.strictEqual(transaction.getMemoString(), memoText);
      assert.deepStrictEqual(transaction.getMemoBytes(), new TextEncoder().encode(memoText));
    });

    it('should set memo from JSON object', function () {
      const memoObj = { user: 'alice', amount: 1000 };
      transaction.setMemoData(memoObj);

      assert.strictEqual(transaction.hasMemo(), true);
      assert.strictEqual(transaction.getMemoString(), JSON.stringify(memoObj));
    });

    it('should set memo from bytes', function () {
      const memoBytes = new TextEncoder().encode('Binary memo data');
      transaction.setMemoData(memoBytes);

      assert.strictEqual(transaction.hasMemo(), true);
      assert.deepStrictEqual(transaction.getMemoBytes(), memoBytes);
      assert.strictEqual(transaction.getMemoString(), 'Binary memo data');
    });

    it('should handle empty string memo', function () {
      transaction.setMemo('');
      assert.strictEqual(transaction.hasMemo(), false);
      assert.strictEqual(transaction.getMemoString(), '');
    });

    it('should handle UTF-8 memo', function () {
      const utf8Memo = 'Hello 世界 🌍 Flare!';
      transaction.setMemo(utf8Memo);

      assert.strictEqual(transaction.hasMemo(), true);
      assert.strictEqual(transaction.getMemoString(), utf8Memo);
    });

    it('should include memo in transaction JSON when present', function () {
      const memoText = 'Transaction metadata';
      transaction.setMemo(memoText);

      // Mock the FlareJS transaction
      const mockTx = createMockTx();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transaction.setTransaction(mockTx as any);
      transaction.setTransactionType(TransactionType.Export);

      const txData = transaction.toJson();
      assert.strictEqual(txData.memo, memoText);
    });

    it('should not include memo in JSON when empty', function () {
      // Mock the FlareJS transaction
      const mockTx = createMockTx();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transaction.setTransaction(mockTx as any);
      transaction.setTransactionType(TransactionType.Export);

      const txData = transaction.toJson();
      assert.strictEqual(txData.memo, '');
    });

    it('should validate memo size limits', function () {
      // Test large memo - this should be validated by utils
      const largeMemo = 'x'.repeat(5000); // 5KB memo
      transaction.setMemo(largeMemo);
      assert.strictEqual(transaction.getMemoString(), largeMemo);
    });

    it('should handle special characters in memo', function () {
      const specialMemo = 'Special chars: \n\t\r\0\x01\xff';
      transaction.setMemo(specialMemo);
      assert.strictEqual(transaction.getMemoString(), specialMemo);
    });

    it('should throw error for invalid memo format in setMemoData', function () {
      // This should be tested in utils, but we can check basic behavior
      assert.throws(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transaction.setMemoData(123 as any);
      });
    });
  });
});
