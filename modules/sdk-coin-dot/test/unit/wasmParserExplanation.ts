/**
 * WASM Parser Explanation Tests
 *
 * Tests for explainDotTransaction, specifically verifying batch transaction
 * handling with proxy deposit costs matches legacy account-lib behavior.
 *
 * Uses WASM-built transactions (not legacy rawTx fixtures) since the WASM
 * parser requires metadata-compatible signed extension encoding.
 *
 * Note: wasm-dot@1.3.0 uses high-level business intents. Batch transactions
 * are produced automatically from the intent (e.g., unstake with stopStaking
 * produces batchAll(removeProxy, chill, unbond)).
 */

import assert from 'assert';
import { coins } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { explainDotTransaction } from '../../src/lib/wasmParser';
import { buildTransaction, type BuildContext, type Material as WasmMaterial } from '@bitgo/wasm-dot';
import type { Material } from '../../src/lib/iface';
import { accounts, westendBlock } from '../fixtures';
import utils from '../../src/lib/utils';

describe('WASM Parser Explanation', function () {
  const coin = coins.get('tdot');
  // utils.getMaterial returns the iface Material shape; cast to WasmMaterial for buildTransaction
  const material = utils.getMaterial(coin) as Material & WasmMaterial;

  function createWasmContext(overrides: Partial<BuildContext> = {}): BuildContext {
    return {
      sender: accounts.account1.address,
      nonce: 0,
      tip: 0n,
      material,
      validity: {
        firstValid: westendBlock.blockNumber,
        maxDuration: 2400,
      },
      referenceBlock: westendBlock.hash,
      ...overrides,
    };
  }

  describe('Batch unstake (removeProxy + chill + unbond)', function () {
    it('should explain batch unstake with proxy deposit cost', function () {
      const unbondAmount = 5000000000000n; // 5 DOT
      const proxyDelegate = accounts.account2.address;

      // Build a full unstake: produces batchAll(removeProxy, chill, unbond)
      const wasmTx = buildTransaction(
        {
          type: 'unstake',
          amount: unbondAmount,
          stopStaking: true,
          proxyAddress: proxyDelegate,
        },
        createWasmContext()
      );

      const txHex = wasmTx.toBroadcastFormat();
      const explanation = explainDotTransaction({
        txHex,
        material,
        senderAddress: accounts.account1.address,
      });

      // Should be Batch type
      assert.strictEqual(explanation.type, TransactionType.Batch);
      assert.ok(explanation.methodName.includes('batchAll'), `Expected batchAll, got ${explanation.methodName}`);

      // Outputs should contain proxy deposit cost, NOT the unbond amount
      assert.strictEqual(explanation.outputs.length, 1, 'Should have exactly one output (proxy deposit cost)');
      const output = explanation.outputs[0];
      assert.strictEqual(output.address, accounts.account1.address, 'Output should go to sender (deposit refund)');
      const proxyDepositCost = BigInt(output.amount);
      assert.ok(proxyDepositCost > 0n, 'Proxy deposit cost should be positive');
      // The proxy deposit cost should NOT equal the unbond amount
      assert.notStrictEqual(proxyDepositCost, unbondAmount, 'Should use proxy deposit cost, not unbond amount');

      // Input should come from the proxy delegate address
      assert.strictEqual(explanation.inputs.length, 1, 'Should have exactly one input');
      assert.strictEqual(explanation.inputs[0].address, proxyDelegate, 'Input should come from proxy delegate');
      assert.strictEqual(
        explanation.inputs[0].valueString,
        output.amount,
        'Input value should equal proxy deposit cost'
      );
    });

    it('proxy deposit cost should be consistent across calls', function () {
      const proxyDelegate = accounts.account2.address;
      const wasmTx = buildTransaction(
        {
          type: 'unstake',
          amount: 1000000000000n,
          stopStaking: true,
          proxyAddress: proxyDelegate,
        },
        createWasmContext()
      );

      const txHex = wasmTx.toBroadcastFormat();
      const explanation1 = explainDotTransaction({ txHex, material, senderAddress: accounts.account1.address });
      const explanation2 = explainDotTransaction({ txHex, material, senderAddress: accounts.account1.address });

      assert.strictEqual(explanation1.outputs[0].amount, explanation2.outputs[0].amount);
    });
  });

  describe('Batch stake (bond + addProxy)', function () {
    it('should explain batch stake with bond amount and proxy deposit cost', function () {
      const bondAmount = 10000000000000n; // 10 DOT
      const proxyDelegate = accounts.account2.address;

      // Build a new stake with proxy: produces batchAll(bond, addProxy)
      const wasmTx = buildTransaction(
        {
          type: 'stake',
          amount: bondAmount,
          proxyAddress: proxyDelegate,
          payee: { type: 'staked' },
        },
        createWasmContext()
      );

      const txHex = wasmTx.toBroadcastFormat();
      const explanation = explainDotTransaction({ txHex, material, senderAddress: accounts.account1.address });

      assert.strictEqual(explanation.type, TransactionType.Batch);

      // Should have two outputs: bond amount (to STAKING_DESTINATION sentinel) + proxy deposit cost (to proxy delegate)
      assert.strictEqual(explanation.outputs.length, 2, 'Should have bond + proxy deposit outputs');

      const stakingOutput = explanation.outputs.find(
        (o) => o.address === '5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM'
      );
      assert.ok(stakingOutput, 'Should have STAKING_DESTINATION sentinel output for bond amount');
      assert.strictEqual(BigInt(stakingOutput!.amount), bondAmount, 'Bond amount should match');

      const proxyOutput = explanation.outputs.find(
        (o) => o.address !== '5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM'
      );
      assert.ok(proxyOutput, 'Should have proxy deposit output');
      assert.strictEqual(proxyOutput!.address, proxyDelegate);
      assert.ok(BigInt(proxyOutput!.amount) > 0n, 'Proxy deposit cost should be positive');

      // All inputs should come from sender
      assert.strictEqual(explanation.inputs.length, 2);
      for (const input of explanation.inputs) {
        assert.strictEqual(input.address, accounts.account1.address);
      }
    });
  });

  describe('Non-batch transactions (should not be affected)', function () {
    it('should explain transfer normally', function () {
      const wasmTx = buildTransaction(
        { type: 'payment', to: accounts.account2.address, amount: 1000000000000n, keepAlive: true },
        createWasmContext()
      );

      const explanation = explainDotTransaction({
        txHex: wasmTx.toBroadcastFormat(),
        material,
        senderAddress: accounts.account1.address,
      });

      assert.strictEqual(explanation.type, TransactionType.Send);
      assert.strictEqual(explanation.outputs.length, 1);
      assert.strictEqual(explanation.outputs[0].address, accounts.account2.address);
      assert.strictEqual(explanation.outputs[0].amount, '1000000000000');
    });

    it('should explain single unstake (unbond) normally', function () {
      const wasmTx = buildTransaction({ type: 'unstake', amount: 5000000000000n }, createWasmContext());

      const explanation = explainDotTransaction({
        txHex: wasmTx.toBroadcastFormat(),
        material,
        senderAddress: accounts.account1.address,
      });

      assert.strictEqual(explanation.type, TransactionType.StakingUnlock);
      // Unbond has no outputs (balance stays in account as unlocking, matching legacy behavior)
      assert.strictEqual(explanation.outputs.length, 0);
    });
  });
});
