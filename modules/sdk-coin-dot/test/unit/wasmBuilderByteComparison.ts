/**
 * WASM Builder Byte Comparison Tests
 *
 * Compare serialized output between:
 * 1. Legacy approach (using @substrate/txwrapper-polkadot)
 * 2. WASM approach (using @bitgo/wasm-dot DotBuilder)
 *
 * For unsigned transactions, legacy toBroadcastFormat() returns the signing payload
 * (via construct.signingPayload). We compare WASM signablePayload() against it.
 *
 * Format difference: txwrapper encodes the call as `Bytes` (Vec<u8>) which includes
 * a SCALE compact-length prefix. subxt encodes it as raw `Call` (no prefix).
 * We strip this prefix from the legacy side before comparing, since the actual
 * call data, era, nonce, tip, and chain context are identical.
 */

import assert from 'assert';
import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory } from '../../src/lib/transactionBuilderFactory';
import { TransferBuilder } from '../../src/lib/transferBuilder';
import { ProxyType } from '../../src/lib/iface';
import { accounts, westendBlock } from '../fixtures';
import utils from '../../src/lib/utils';

// Import WASM builder
import { buildTransaction, type BuildContext, type Material } from '@bitgo/wasm-dot';

describe('WASM vs Legacy Builder Byte Comparison', function () {
  const coin = coins.get('tdot');

  // Get material from utils to ensure same metadata as legacy builder
  const material = utils.getMaterial(coin);

  function createWasmContext(overrides: Partial<BuildContext> = {}): BuildContext {
    return {
      sender: accounts.account1.address,
      nonce: 0,
      tip: 0n,
      material: material as Material,
      validity: {
        firstValid: westendBlock.blockNumber,
        maxDuration: 2400,
      },
      referenceBlock: westendBlock.hash,
      ...overrides,
    };
  }

  /**
   * Strip SCALE compact-length prefix from the legacy signing payload.
   *
   * Legacy (txwrapper) encodes the call as `Bytes` type, which adds a compact-length
   * prefix. subxt encodes it as raw `Call` (no prefix). Both produce identical
   * call data + era + nonce + tip + chain context after this prefix.
   */
  function stripCompactPrefix(hex: string): string {
    const data = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = Buffer.from(data, 'hex');
    const mode = bytes[0] & 0b11;
    let offset: number;
    if (mode === 0b00) offset = 1;
    else if (mode === 0b01) offset = 2;
    else if (mode === 0b10) offset = 4;
    else throw new Error('Big compact not supported');
    return '0x' + bytes.slice(offset).toString('hex');
  }

  // ===========================================================================
  // Transfer Transaction Tests
  // ===========================================================================
  describe('Transfer Transactions', function () {
    it('should produce identical signing payload for transfer', async function () {
      const to = accounts.account2.address;
      const amount = '1000000000000'; // 1 DOT

      const factory = new TransactionBuilderFactory(coin);
      const legacyBuilder = factory.getTransferBuilder() as TransferBuilder;

      legacyBuilder
        .sender({ address: accounts.account1.address })
        .to({ address: to })
        .amount(amount)
        .validity({ firstValid: westendBlock.blockNumber, maxDuration: 2400 })
        .referenceBlock(westendBlock.hash)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 });

      const legacyTx = await legacyBuilder.build();
      const legacyHex = legacyTx.toBroadcastFormat();

      const wasmTx = buildTransaction(
        { type: 'transfer', to, amount: BigInt(amount), keepAlive: true },
        createWasmContext()
      );
      const wasmHex = '0x' + Buffer.from(wasmTx.signablePayload()).toString('hex');

      assert.strictEqual(wasmHex, stripCompactPrefix(legacyHex), 'Signing payload should match');
    });

    it('should produce identical signing payload for transferKeepAlive with different nonce', async function () {
      const to = accounts.account2.address;
      const amount = '5000000000000'; // 5 DOT

      const factory = new TransactionBuilderFactory(coin);
      const legacyBuilder = factory.getTransferBuilder() as TransferBuilder;

      legacyBuilder
        .sender({ address: accounts.account1.address })
        .to({ address: to })
        .amount(amount)
        .validity({ firstValid: westendBlock.blockNumber, maxDuration: 2400 })
        .referenceBlock(westendBlock.hash)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 5 });

      const legacyTx = await legacyBuilder.build();
      const legacyHex = legacyTx.toBroadcastFormat();

      const wasmTx = buildTransaction(
        { type: 'transfer', to, amount: BigInt(amount), keepAlive: true },
        createWasmContext({ nonce: 5 })
      );
      const wasmHex = '0x' + Buffer.from(wasmTx.signablePayload()).toString('hex');

      assert.strictEqual(wasmHex, stripCompactPrefix(legacyHex), 'Signing payload should match');
    });
  });

  // ===========================================================================
  // Staking Transaction Tests
  // ===========================================================================
  describe('Staking Transactions', function () {
    it('should produce identical signing payload for staking bond', async function () {
      const amount = '10000000000000'; // 10 DOT

      const factory = new TransactionBuilderFactory(coin);
      const legacyBuilder = factory.getStakingBuilder();

      legacyBuilder
        .sender({ address: accounts.account1.address })
        .amount(amount)
        .payee('Staked')
        .validity({ firstValid: westendBlock.blockNumber, maxDuration: 2400 })
        .referenceBlock(westendBlock.hash)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 });

      const legacyTx = await legacyBuilder.build();
      const legacyHex = legacyTx.toBroadcastFormat();

      const wasmTx = buildTransaction(
        { type: 'stake', amount: BigInt(amount), payee: { type: 'staked' } },
        createWasmContext()
      );
      const wasmHex = '0x' + Buffer.from(wasmTx.signablePayload()).toString('hex');

      assert.strictEqual(wasmHex, stripCompactPrefix(legacyHex), 'Signing payload should match');
    });

    it('should produce identical signing payload for staking bond with Stash payee', async function () {
      const amount = '20000000000000'; // 20 DOT

      const factory = new TransactionBuilderFactory(coin);
      const legacyBuilder = factory.getStakingBuilder();

      legacyBuilder
        .sender({ address: accounts.account1.address })
        .amount(amount)
        .payee('Stash')
        .validity({ firstValid: westendBlock.blockNumber, maxDuration: 2400 })
        .referenceBlock(westendBlock.hash)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 });

      const legacyTx = await legacyBuilder.build();
      const legacyHex = legacyTx.toBroadcastFormat();

      const wasmTx = buildTransaction(
        { type: 'stake', amount: BigInt(amount), payee: { type: 'stash' } },
        createWasmContext()
      );
      const wasmHex = '0x' + Buffer.from(wasmTx.signablePayload()).toString('hex');

      assert.strictEqual(wasmHex, stripCompactPrefix(legacyHex), 'Signing payload should match');
    });

    it('should produce identical signing payload for unstake (unbond)', async function () {
      const amount = '5000000000000'; // 5 DOT

      const factory = new TransactionBuilderFactory(coin);
      const legacyBuilder = factory.getUnstakeBuilder();

      legacyBuilder
        .sender({ address: accounts.account1.address })
        .amount(amount)
        .validity({ firstValid: westendBlock.blockNumber, maxDuration: 2400 })
        .referenceBlock(westendBlock.hash)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 });

      const legacyTx = await legacyBuilder.build();
      const legacyHex = legacyTx.toBroadcastFormat();

      const wasmTx = buildTransaction({ type: 'unstake', amount: BigInt(amount) }, createWasmContext());
      const wasmHex = '0x' + Buffer.from(wasmTx.signablePayload()).toString('hex');

      assert.strictEqual(wasmHex, stripCompactPrefix(legacyHex), 'Signing payload should match');
    });

    it('should produce identical signing payload for withdrawUnbonded', async function () {
      const slashingSpans = 0;

      const factory = new TransactionBuilderFactory(coin);
      const legacyBuilder = factory.getWithdrawUnstakedBuilder();

      legacyBuilder
        .sender({ address: accounts.account1.address })
        .slashingSpans(slashingSpans)
        .validity({ firstValid: westendBlock.blockNumber, maxDuration: 2400 })
        .referenceBlock(westendBlock.hash)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 });

      const legacyTx = await legacyBuilder.build();
      const legacyHex = legacyTx.toBroadcastFormat();

      const wasmTx = buildTransaction({ type: 'withdrawUnbonded', slashingSpans }, createWasmContext());
      const wasmHex = '0x' + Buffer.from(wasmTx.signablePayload()).toString('hex');

      assert.strictEqual(wasmHex, stripCompactPrefix(legacyHex), 'Signing payload should match');
    });

    it('should produce identical signing payload for chill (unnominate)', async function () {
      const factory = new TransactionBuilderFactory(coin);
      const legacyBuilder = factory.getUnnominateBuilder();

      legacyBuilder
        .sender({ address: accounts.account1.address })
        .validity({ firstValid: westendBlock.blockNumber, maxDuration: 2400 })
        .referenceBlock(westendBlock.hash)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 });

      const legacyTx = await legacyBuilder.build();
      const legacyHex = legacyTx.toBroadcastFormat();

      const wasmTx = buildTransaction({ type: 'chill' }, createWasmContext());
      const wasmHex = '0x' + Buffer.from(wasmTx.signablePayload()).toString('hex');

      assert.strictEqual(wasmHex, stripCompactPrefix(legacyHex), 'Signing payload should match');
    });
  });

  // ===========================================================================
  // Proxy Transaction Tests
  // ===========================================================================
  describe('Proxy Transactions', function () {
    it('should produce identical signing payload for addProxy', async function () {
      const delegate = accounts.account2.address;

      const factory = new TransactionBuilderFactory(coin);
      const legacyBuilder = factory.getAddressInitializationBuilder();

      legacyBuilder
        .sender({ address: accounts.account1.address })
        .owner({ address: delegate })
        .type(ProxyType.ANY)
        .delay('0')
        .validity({ firstValid: westendBlock.blockNumber, maxDuration: 2400 })
        .referenceBlock(westendBlock.hash)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 });

      const legacyTx = await legacyBuilder.build();
      const legacyHex = legacyTx.toBroadcastFormat();

      const wasmTx = buildTransaction({ type: 'addProxy', delegate, proxyType: 'Any', delay: 0 }, createWasmContext());
      const wasmHex = '0x' + Buffer.from(wasmTx.signablePayload()).toString('hex');

      assert.strictEqual(wasmHex, stripCompactPrefix(legacyHex), 'Signing payload should match');
    });

    it('should produce identical signing payload for addProxy with Staking type', async function () {
      const delegate = accounts.account2.address;

      const factory = new TransactionBuilderFactory(coin);
      const legacyBuilder = factory.getAddressInitializationBuilder();

      legacyBuilder
        .sender({ address: accounts.account1.address })
        .owner({ address: delegate })
        .type(ProxyType.STAKING)
        .delay('100')
        .validity({ firstValid: westendBlock.blockNumber, maxDuration: 2400 })
        .referenceBlock(westendBlock.hash)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 });

      const legacyTx = await legacyBuilder.build();
      const legacyHex = legacyTx.toBroadcastFormat();

      const wasmTx = buildTransaction(
        { type: 'addProxy', delegate, proxyType: 'Staking', delay: 100 },
        createWasmContext()
      );
      const wasmHex = '0x' + Buffer.from(wasmTx.signablePayload()).toString('hex');

      assert.strictEqual(wasmHex, stripCompactPrefix(legacyHex), 'Signing payload should match');
    });
  });

  // ===========================================================================
  // Batch Transaction Tests
  // ===========================================================================
  describe('Batch Transactions', function () {
    it('should produce identical signing payload for batch of transfers', async function () {
      const to1 = accounts.account2.address;
      const to2 = accounts.account3.address;
      const amount1 = '1000000000000';
      const amount2 = '2000000000000';

      // Legacy batch requires raw call hex for each sub-call
      const factory = new TransactionBuilderFactory(coin);

      // Build individual transfers to get their call data for the legacy batch
      const t1 = factory.getTransferBuilder() as TransferBuilder;
      t1.sender({ address: accounts.account1.address })
        .to({ address: to1 })
        .amount(amount1)
        .validity({ firstValid: westendBlock.blockNumber, maxDuration: 2400 })
        .referenceBlock(westendBlock.hash)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 });
      const tx1 = await t1.build();

      const t2 = factory.getTransferBuilder() as TransferBuilder;
      t2.sender({ address: accounts.account1.address })
        .to({ address: to2 })
        .amount(amount2)
        .validity({ firstValid: westendBlock.blockNumber, maxDuration: 2400 })
        .referenceBlock(westendBlock.hash)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 });
      const tx2 = await t2.build();

      // Extract call data from legacy signing payload for batch construction.
      // Legacy toBroadcastFormat() for unsigned txs returns the signing payload
      // which starts with a compact-length-prefixed call.
      function extractCallFromSigningPayload(signingPayload: string): string {
        const hexData = signingPayload.startsWith('0x') ? signingPayload.slice(2) : signingPayload;
        const bytes = Buffer.from(hexData, 'hex');
        // Decode compact length prefix to find where call data ends
        const mode = bytes[0] & 0b11;
        let callLength: number;
        let offset: number;
        if (mode === 0b00) {
          callLength = bytes[0] >> 2;
          offset = 1;
        } else if (mode === 0b01) {
          callLength = (bytes[0] | (bytes[1] << 8)) >> 2;
          offset = 2;
        } else if (mode === 0b10) {
          callLength = (bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24)) >> 2;
          offset = 4;
        } else {
          throw new Error('Unsupported compact length mode');
        }
        return '0x' + bytes.slice(offset, offset + callLength).toString('hex');
      }

      const call1Hex = extractCallFromSigningPayload(tx1.toBroadcastFormat());
      const call2Hex = extractCallFromSigningPayload(tx2.toBroadcastFormat());

      const batchBuilder = factory.getBatchTransactionBuilder();
      batchBuilder
        .sender({ address: accounts.account1.address })
        .calls([call1Hex, call2Hex])
        .atomic(true)
        .validity({ firstValid: westendBlock.blockNumber, maxDuration: 2400 })
        .referenceBlock(westendBlock.hash)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 });

      const legacyTx = await batchBuilder.build();
      const legacyHex = legacyTx.toBroadcastFormat();

      const wasmTx = buildTransaction(
        {
          type: 'batch',
          calls: [
            { type: 'transfer', to: to1, amount: BigInt(amount1), keepAlive: true },
            { type: 'transfer', to: to2, amount: BigInt(amount2), keepAlive: true },
          ],
          atomic: true,
        },
        createWasmContext()
      );
      const wasmHex = '0x' + Buffer.from(wasmTx.signablePayload()).toString('hex');

      assert.strictEqual(wasmHex, stripCompactPrefix(legacyHex), 'Signing payload should match');
    });

    it('should produce identical signing payload for non-atomic batch', async function () {
      const to = accounts.account2.address;
      const amount = '1000000000000';

      const factory = new TransactionBuilderFactory(coin);

      const transferBuilder = factory.getTransferBuilder() as TransferBuilder;
      transferBuilder
        .sender({ address: accounts.account1.address })
        .to({ address: to })
        .amount(amount)
        .validity({ firstValid: westendBlock.blockNumber, maxDuration: 2400 })
        .referenceBlock(westendBlock.hash)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 });
      const transferTx = await transferBuilder.build();

      function extractCallFromSigningPayload(signingPayload: string): string {
        const hexData = signingPayload.startsWith('0x') ? signingPayload.slice(2) : signingPayload;
        const bytes = Buffer.from(hexData, 'hex');
        const mode = bytes[0] & 0b11;
        let callLength: number;
        let offset: number;
        if (mode === 0b00) {
          callLength = bytes[0] >> 2;
          offset = 1;
        } else if (mode === 0b01) {
          callLength = (bytes[0] | (bytes[1] << 8)) >> 2;
          offset = 2;
        } else if (mode === 0b10) {
          callLength = (bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24)) >> 2;
          offset = 4;
        } else {
          throw new Error('Unsupported compact length mode');
        }
        return '0x' + bytes.slice(offset, offset + callLength).toString('hex');
      }

      const callHex = extractCallFromSigningPayload(transferTx.toBroadcastFormat());

      const batchBuilder = factory.getBatchTransactionBuilder();
      batchBuilder
        .sender({ address: accounts.account1.address })
        .calls([callHex])
        .atomic(false)
        .validity({ firstValid: westendBlock.blockNumber, maxDuration: 2400 })
        .referenceBlock(westendBlock.hash)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 });

      const legacyTx = await batchBuilder.build();
      const legacyHex = legacyTx.toBroadcastFormat();

      const wasmTx = buildTransaction(
        {
          type: 'batch',
          calls: [{ type: 'transfer', to, amount: BigInt(amount), keepAlive: true }],
          atomic: false,
        },
        createWasmContext()
      );
      const wasmHex = '0x' + Buffer.from(wasmTx.signablePayload()).toString('hex');

      assert.strictEqual(wasmHex, stripCompactPrefix(legacyHex), 'Signing payload should match');
    });
  });

  // ===========================================================================
  // Intent-based Transaction Building (sanity checks)
  // ===========================================================================
  describe('Intent-based Transaction Building', function () {
    it('should build transfer from intent', async function () {
      const wasmTx = buildTransaction(
        { type: 'transfer', to: accounts.account2.address, amount: 1000000000000n, keepAlive: true },
        createWasmContext()
      );
      const serialized = wasmTx.toBroadcastFormat();
      assert(serialized.startsWith('0x'), 'Should be hex encoded');
      assert(serialized.length > 10, 'Should have content');
    });

    it('should build stake from intent', async function () {
      const wasmTx = buildTransaction(
        { type: 'stake', amount: 5000000000000n, payee: { type: 'staked' } },
        createWasmContext()
      );
      assert(wasmTx.toBroadcastFormat().startsWith('0x'));
    });

    it('should build withdrawUnbonded from intent', async function () {
      const wasmTx = buildTransaction({ type: 'withdrawUnbonded', slashingSpans: 0 }, createWasmContext());
      assert(wasmTx.toBroadcastFormat().startsWith('0x'));
    });

    it('should build chill from intent', async function () {
      const wasmTx = buildTransaction({ type: 'chill' }, createWasmContext());
      assert(wasmTx.toBroadcastFormat().startsWith('0x'));
    });

    it('should build addProxy from intent', async function () {
      const wasmTx = buildTransaction(
        { type: 'addProxy', delegate: accounts.account2.address, proxyType: 'Any', delay: 0 },
        createWasmContext()
      );
      assert(wasmTx.toBroadcastFormat().startsWith('0x'));
    });

    it('should build batch from intent', async function () {
      const wasmTx = buildTransaction(
        {
          type: 'batch',
          calls: [
            { type: 'transfer', to: accounts.account2.address, amount: 1000000000000n, keepAlive: true },
            { type: 'chill' },
          ],
          atomic: true,
        },
        createWasmContext()
      );
      assert(wasmTx.toBroadcastFormat().startsWith('0x'));
    });
  });
});
