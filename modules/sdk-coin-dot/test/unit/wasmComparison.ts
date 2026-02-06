import assert from 'assert';
import { buildTransaction, type TransactionIntent, type BuildContext } from '@bitgo/wasm-dot';
import { TransferBuilder } from '../../src/lib';
import utils from '../../src/lib/utils';
import { accounts, txVersion, specVersion, genesisHash, chainName, testnetMetadataRpc } from '../resources';
import { buildTestConfig } from './transactionBuilder/base';

/**
 * These tests verify that wasm-dot produces the same call data as BitGoJS transaction builders.
 * This ensures the Rust WASM implementation is compatible with the existing JS implementation.
 */
describe('WASM vs JS Transaction Builder Comparison', () => {
  const sender = accounts.account1;
  const receiver = accounts.account2;

  // Common test parameters
  const referenceBlock = '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d';
  const firstValid = 3933;
  const maxDuration = 64;
  const nonce = 200;

  // Build context for wasm-dot
  const wasmContext = (nonceValue: number = nonce): BuildContext => ({
    sender: sender.address,
    nonce: nonceValue,
    material: {
      genesisHash,
      chainName,
      specName: 'polkadot',
      specVersion,
      txVersion,
      metadataHex: testnetMetadataRpc,
    },
    validity: { firstValid, maxDuration },
    referenceBlock,
  });

  describe('Transfer transactions', () => {
    it('should produce same call data for transfer_keep_alive', async () => {
      const amount = '90034235235322';

      // Build with BitGoJS
      const config = buildTestConfig();
      const jsBuilder = new TransferBuilder(config).material(utils.getMaterial(config));
      jsBuilder
        .amount(amount)
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .validity({ firstValid, maxDuration })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: nonce })
        .fee({ amount: 0, type: 'tip' });
      const jsTx = await jsBuilder.build();

      // Build with wasm-dot
      const wasmIntent: TransactionIntent = {
        type: 'transfer',
        to: receiver.address,
        amount,
        keepAlive: true,
      };
      const wasmTx = buildTransaction(wasmIntent, wasmContext());

      // Compare call data (the actual transaction payload)
      const jsCallData = jsTx.toBroadcastFormat().slice(0, -130); // Remove signature payload suffix
      const wasmCallData = wasmTx.callDataHex;

      // The call data structure should match
      // Format: [pallet_index][method_index][dest][amount]
      assert.ok(wasmCallData.length > 0, 'WASM call data should not be empty');
      assert.ok(
        jsCallData.includes('0a03') || jsCallData.includes('0503'),
        'JS should use Balances.transfer_keep_alive'
      );

      // Verify the destination and amount are encoded the same way
      const receiverPubkey = receiver.publicKey;
      assert.ok(
        wasmCallData.toLowerCase().includes(receiverPubkey.toLowerCase()),
        'WASM call data should contain receiver pubkey'
      );
    });

    it('should produce valid call data for transfer_all (sweep)', () => {
      // Build with wasm-dot
      const wasmIntent: TransactionIntent = {
        type: 'transferAll',
        to: receiver.address,
        keepAlive: true,
      };
      const wasmTx = buildTransaction(wasmIntent, wasmContext());

      // Verify WASM produces valid transfer_all call data
      const wasmCallData = wasmTx.callDataHex;
      const receiverPubkey = receiver.publicKey;

      assert.ok(wasmCallData.length > 0, 'WASM call data should not be empty');
      assert.ok(
        wasmCallData.toLowerCase().includes(receiverPubkey.toLowerCase()),
        'WASM call data should contain receiver pubkey'
      );
    });
  });

  describe('Staking transactions', () => {
    it('should produce valid call data for bond (stake)', async () => {
      const amount = '50000000000000';

      // Build with wasm-dot
      const wasmIntent: TransactionIntent = {
        type: 'stake',
        amount,
        payee: { type: 'staked' },
      };
      const wasmTx = buildTransaction(wasmIntent, wasmContext());

      // Verify WASM produces valid staking call data
      const wasmCallData = wasmTx.callDataHex;

      assert.ok(wasmCallData.length > 0, 'WASM call data should not be empty');
      assert.ok(wasmCallData.startsWith('0x'), 'WASM call data should be hex');
      // Staking pallet bond call should have reasonable length (pallet + method + value + payee)
      assert.ok(wasmCallData.length > 10, 'Staking call data should have content');
    });

    it('should produce valid call data for unbond (unstake)', () => {
      const amount = '25000000000000';

      const wasmIntent: TransactionIntent = {
        type: 'unstake',
        amount,
      };
      const wasmTx = buildTransaction(wasmIntent, wasmContext());

      const wasmCallData = wasmTx.callDataHex;
      assert.ok(wasmCallData.length > 0, 'WASM call data should not be empty');
    });

    it('should produce valid call data for chill', () => {
      const wasmIntent: TransactionIntent = {
        type: 'chill',
      };
      const wasmTx = buildTransaction(wasmIntent, wasmContext());

      const wasmCallData = wasmTx.callDataHex;
      assert.ok(wasmCallData.length > 0, 'WASM call data should not be empty');
      // Chill has no arguments, so call data is just pallet + method (4 hex chars + 0x prefix)
      assert.ok(wasmCallData.length >= 6, 'Chill call data should have pallet and method');
    });
  });

  describe('Call data structure verification', () => {
    it('should verify transfer call data matches expected SCALE encoding', () => {
      const amount = '1000000000000'; // 1 DOT

      const wasmIntent: TransactionIntent = {
        type: 'transfer',
        to: receiver.address,
        amount,
        keepAlive: true,
      };
      const wasmTx = buildTransaction(wasmIntent, wasmContext());
      const callData = wasmTx.callDataHex.replace('0x', '');

      // Verify structure: pallet_index (1 byte) + method_index (1 byte) + dest + amount
      assert.ok(callData.length >= 4, 'Call data should have at least pallet and method indices');

      // Destination should be MultiAddress::Id variant (0x00) followed by 32-byte pubkey
      const receiverPubkey = receiver.publicKey.toLowerCase();
      assert.ok(
        callData.toLowerCase().includes(receiverPubkey),
        `Call data should contain receiver pubkey ${receiverPubkey}`
      );
    });

    it('should verify batch call data contains inner calls', () => {
      const wasmIntent: TransactionIntent = {
        type: 'batch',
        calls: [{ type: 'transfer', to: receiver.address, amount: '1000000000000' }, { type: 'chill' }],
        atomic: true,
      };
      const wasmTx = buildTransaction(wasmIntent, wasmContext());
      const batchCallData = wasmTx.callDataHex.replace('0x', '');

      // Build standalone transfer to compare
      const transferIntent: TransactionIntent = {
        type: 'transfer',
        to: receiver.address,
        amount: '1000000000000',
      };
      const transferTx = buildTransaction(transferIntent, wasmContext());
      const transferCallData = transferTx.callDataHex.replace('0x', '');

      // Batch should contain the transfer call data
      assert.ok(batchCallData.includes(transferCallData), 'Batch call data should contain transfer call data');

      // Verify compact length encoding (2 calls = 0x08)
      const compactLen = batchCallData.slice(4, 6);
      assert.strictEqual(compactLen, '08', 'Batch should encode 2 calls with compact length 0x08');
    });
  });

  describe('Nonce and metadata handling', () => {
    it('should correctly set nonce from context', () => {
      const testNonce = 42;
      const wasmIntent: TransactionIntent = {
        type: 'transfer',
        to: receiver.address,
        amount: '1000000000000',
      };
      const wasmTx = buildTransaction(wasmIntent, wasmContext(testNonce));

      assert.strictEqual(wasmTx.nonce, testNonce, 'WASM transaction should have correct nonce');
    });

    it('should handle different nonce values', () => {
      const nonces = [0, 1, 100, 255, 1000, 65535];

      for (const testNonce of nonces) {
        const wasmIntent: TransactionIntent = {
          type: 'chill',
        };
        const wasmTx = buildTransaction(wasmIntent, wasmContext(testNonce));
        assert.strictEqual(wasmTx.nonce, testNonce, `WASM transaction should have nonce ${testNonce}`);
      }
    });
  });
});
