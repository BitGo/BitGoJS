/**
 * WASM Builder Byte Comparison Tests
 *
 * Compare serialized output between:
 * 1. Legacy approach (using @substrate/txwrapper-polkadot)
 * 2. WASM approach (using @bitgo/wasm-dot buildTransaction)
 *
 * For unsigned transactions, legacy toBroadcastFormat() returns the signing payload
 * (via construct.signingPayload). We compare WASM signablePayload() against it.
 *
 * Format difference: txwrapper encodes the call as `Bytes` (Vec<u8>) which includes
 * a SCALE compact-length prefix. subxt encodes it as raw `Call` (no prefix).
 * We strip this prefix from the legacy side before comparing, since the actual
 * call data, era, nonce, tip, and chain context are identical.
 *
 * Note: wasm-dot@1.3.0 uses high-level business intents (payment, stake, unstake,
 * claim, consolidate) instead of low-level call types. Batch and proxy operations
 * are composed automatically from the intent (e.g., stake with proxyAddress
 * produces batchAll(bond, addProxy)).
 */

import assert from 'assert';
import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory } from '../../src/lib/transactionBuilderFactory';
import { TransferBuilder } from '../../src/lib/transferBuilder';
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
        { type: 'payment', to, amount: BigInt(amount), keepAlive: true },
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
        { type: 'payment', to, amount: BigInt(amount), keepAlive: true },
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
    // Note: wasm-dot@1.3.0 `stake` without proxyAddress produces bondExtra (top-up),
    // while the legacy getStakingBuilder() produces bond (initial stake). These are
    // different extrinsic calls so byte comparison is not applicable. The bond call
    // is now only produced via `stake` with proxyAddress (which creates a batch).
    // See Intent-based Transaction Building tests below for stake sanity checks.

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

    it('should produce identical signing payload for withdrawUnbonded (claim)', async function () {
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

      const wasmTx = buildTransaction({ type: 'claim', slashingSpans }, createWasmContext());
      const wasmHex = '0x' + Buffer.from(wasmTx.signablePayload()).toString('hex');

      assert.strictEqual(wasmHex, stripCompactPrefix(legacyHex), 'Signing payload should match');
    });
  });

  // ===========================================================================
  // Intent-based Transaction Building (sanity checks)
  // ===========================================================================
  describe('Intent-based Transaction Building', function () {
    it('should build payment from intent', async function () {
      const wasmTx = buildTransaction(
        { type: 'payment', to: accounts.account2.address, amount: 1000000000000n, keepAlive: true },
        createWasmContext()
      );
      const serialized = wasmTx.toBroadcastFormat();
      assert(serialized.startsWith('0x'), 'Should be hex encoded');
      assert(serialized.length > 10, 'Should have content');
    });

    it('should build stake (top-up) from intent', async function () {
      const wasmTx = buildTransaction(
        { type: 'stake', amount: 5000000000000n, payee: { type: 'staked' } },
        createWasmContext()
      );
      assert(wasmTx.toBroadcastFormat().startsWith('0x'));
    });

    it('should build stake with proxy (new stake / batchAll(bond, addProxy)) from intent', async function () {
      const wasmTx = buildTransaction(
        { type: 'stake', amount: 10000000000000n, proxyAddress: accounts.account2.address, payee: { type: 'staked' } },
        createWasmContext()
      );
      assert(wasmTx.toBroadcastFormat().startsWith('0x'));
    });

    it('should build claim (withdrawUnbonded) from intent', async function () {
      const wasmTx = buildTransaction({ type: 'claim', slashingSpans: 0 }, createWasmContext());
      assert(wasmTx.toBroadcastFormat().startsWith('0x'));
    });

    it('should build unstake (partial / unbond) from intent', async function () {
      const wasmTx = buildTransaction({ type: 'unstake', amount: 5000000000000n }, createWasmContext());
      assert(wasmTx.toBroadcastFormat().startsWith('0x'));
    });

    it('should build unstake with stopStaking (full / batchAll(removeProxy, chill, unbond)) from intent', async function () {
      const wasmTx = buildTransaction(
        {
          type: 'unstake',
          amount: 5000000000000n,
          stopStaking: true,
          proxyAddress: accounts.account2.address,
        },
        createWasmContext()
      );
      assert(wasmTx.toBroadcastFormat().startsWith('0x'));
    });

    it('should build consolidate (transferAll) from intent', async function () {
      const wasmTx = buildTransaction({ type: 'consolidate', to: accounts.account2.address }, createWasmContext());
      assert(wasmTx.toBroadcastFormat().startsWith('0x'));
    });
  });
});
