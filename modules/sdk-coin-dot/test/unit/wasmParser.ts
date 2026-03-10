import assert from 'assert';
import { coins } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { buildTransaction, type BuildContext, type Material as WasmMaterial } from '@bitgo/wasm-dot';
import { explainDotTransaction } from '../../src/lib/wasmParser';
import type { Material } from '../../src/lib/iface';
import utils from '../../src/lib/utils';
import { accounts, westendBlock } from '../fixtures';

describe('WASM Parser (wasmParser.ts)', function () {
  const coin = coins.get('tdot');
  const material = utils.getMaterial(coin) as Material & WasmMaterial;

  const SENDER = accounts.account1.address;
  const RECIPIENT = accounts.account2.address;

  function createContext(overrides: Partial<BuildContext> = {}): BuildContext {
    return {
      sender: SENDER,
      nonce: 0,
      tip: 0n,
      material,
      validity: { firstValid: westendBlock.blockNumber, maxDuration: 2400 },
      referenceBlock: westendBlock.hash,
      ...overrides,
    };
  }

  describe('explainDotTransaction', function () {
    describe('transfer (payment)', function () {
      it('should explain a transferKeepAlive transaction', function () {
        const tx = buildTransaction({ type: 'payment', to: RECIPIENT, amount: 1_000_000_000_000n }, createContext());
        const explained = explainDotTransaction({ txHex: tx.toBroadcastFormat(), material, senderAddress: SENDER });

        assert.strictEqual(explained.type, TransactionType.Send);
        assert.strictEqual(explained.methodName, 'balances.transferKeepAlive');
        assert.strictEqual(explained.outputs.length, 1);
        assert.strictEqual(explained.outputs[0].address, RECIPIENT);
        assert.strictEqual(explained.outputs[0].amount, '1000000000000');
        assert.strictEqual(explained.outputAmount, '1000000000000');
        assert.strictEqual(explained.inputs.length, 1);
        assert.strictEqual(explained.inputs[0].address, SENDER);
        assert.strictEqual(explained.inputs[0].value, 1_000_000_000_000);
        assert.strictEqual(explained.sender, SENDER);
        assert.strictEqual(explained.nonce, 0);
        assert.strictEqual(explained.isSigned, false);
        assert.strictEqual(explained.changeAmount, '0');
        assert.deepStrictEqual(explained.changeOutputs, []);
      });

      it('should use senderAddress as fallback when not encoded in unsigned extrinsic', function () {
        const tx = buildTransaction({ type: 'payment', to: RECIPIENT, amount: 500_000_000_000n }, createContext());
        const explained = explainDotTransaction({ txHex: tx.toBroadcastFormat(), material, senderAddress: SENDER });
        assert.strictEqual(explained.sender, SENDER);
      });

      it('should explain a transferAll (consolidate) transaction', function () {
        const tx = buildTransaction({ type: 'consolidate', to: RECIPIENT, keepAlive: true }, createContext());
        const explained = explainDotTransaction({ txHex: tx.toBroadcastFormat(), material, senderAddress: SENDER });

        assert.strictEqual(explained.type, TransactionType.Send);
        assert.ok(explained.methodName.includes('transferAll'), `Expected transferAll, got ${explained.methodName}`);
        assert.strictEqual(explained.outputs.length, 1);
        assert.strictEqual(explained.outputs[0].address, RECIPIENT);
        // transferAll amount is reported as '0' (unknown at build time)
        assert.strictEqual(explained.outputs[0].amount, '0');
        assert.strictEqual(explained.outputAmount, '0');
      });

      it('should carry nonce through context', function () {
        const tx = buildTransaction({ type: 'payment', to: RECIPIENT, amount: 1n }, createContext({ nonce: 7 }));
        const explained = explainDotTransaction({ txHex: tx.toBroadcastFormat(), material, senderAddress: SENDER });
        assert.strictEqual(explained.nonce, 7);
      });
    });

    describe('staking (bond)', function () {
      it('should explain a bond transaction', function () {
        const STAKING_DESTINATION = '5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM';
        const tx = buildTransaction(
          { type: 'stake', amount: 5_000_000_000_000n, payee: { type: 'staked' } },
          createContext()
        );
        const explained = explainDotTransaction({ txHex: tx.toBroadcastFormat(), material, senderAddress: SENDER });

        assert.strictEqual(explained.type, TransactionType.StakingActivate);
        assert.strictEqual(explained.outputs.length, 1);
        assert.strictEqual(explained.outputs[0].address, STAKING_DESTINATION);
        assert.strictEqual(explained.outputs[0].amount, '5000000000000');
        assert.strictEqual(explained.outputAmount, '5000000000000');
        assert.strictEqual(explained.inputs[0].address, SENDER);
      });

      it('should explain a batch stake (bond + addProxy)', function () {
        const STAKING_DESTINATION = '5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM';
        const proxyDelegate = accounts.account2.address;
        const tx = buildTransaction(
          { type: 'stake', amount: 5_000_000_000_000n, proxyAddress: proxyDelegate, payee: { type: 'staked' } },
          createContext()
        );
        const explained = explainDotTransaction({ txHex: tx.toBroadcastFormat(), material, senderAddress: SENDER });

        assert.strictEqual(explained.type, TransactionType.Batch);
        // Two outputs: bond → staking destination, addProxy deposit → proxy address
        assert.strictEqual(explained.outputs.length, 2);
        assert.strictEqual(explained.outputs[0].address, STAKING_DESTINATION);
        assert.strictEqual(explained.outputs[0].amount, '5000000000000');
        assert.strictEqual(explained.outputs[1].address, proxyDelegate);
        const proxyDepositCost = BigInt(explained.outputs[1].amount);
        assert.ok(proxyDepositCost > 0n, 'Proxy deposit cost should be positive');
      });
    });

    describe('unstaking (unbond)', function () {
      it('should explain a simple unbond transaction', function () {
        const tx = buildTransaction({ type: 'unstake', amount: 2_000_000_000_000n }, createContext());
        const explained = explainDotTransaction({ txHex: tx.toBroadcastFormat(), material, senderAddress: SENDER });

        assert.strictEqual(explained.type, TransactionType.StakingUnlock);
      });

      it('should explain a full unstake batch (removeProxy + chill + unbond)', function () {
        const proxyDelegate = accounts.account2.address;
        const unbondAmount = 5_000_000_000_000n;
        const tx = buildTransaction(
          { type: 'unstake', amount: unbondAmount, stopStaking: true, proxyAddress: proxyDelegate },
          createContext()
        );
        const explained = explainDotTransaction({ txHex: tx.toBroadcastFormat(), material, senderAddress: SENDER });

        assert.strictEqual(explained.type, TransactionType.Batch);
        // One output: proxy deposit refund to sender
        assert.strictEqual(explained.outputs.length, 1);
        assert.strictEqual(explained.outputs[0].address, SENDER, 'Refund should go to sender');
        const refundAmount = BigInt(explained.outputs[0].amount);
        assert.ok(refundAmount > 0n, 'Proxy deposit refund should be positive');
        // The refund should NOT equal the unbond amount
        assert.notStrictEqual(refundAmount, unbondAmount, 'Should report proxy deposit cost, not unbond amount');
        // One input: proxy deposit returned from the proxy address
        assert.strictEqual(explained.inputs.length, 1);
        assert.strictEqual(explained.inputs[0].address, proxyDelegate);
      });
    });

    describe('fee handling', function () {
      it('should include tip in fee field', function () {
        const tip = 100_000n;
        const tx = buildTransaction(
          { type: 'payment', to: RECIPIENT, amount: 1_000_000_000_000n },
          createContext({ tip })
        );
        const explained = explainDotTransaction({ txHex: tx.toBroadcastFormat(), material, senderAddress: SENDER });
        assert.strictEqual(explained.fee.type, 'tip');
        assert.strictEqual(explained.fee.fee, tip.toString());
      });

      it('should report zero fee when no tip set', function () {
        const tx = buildTransaction({ type: 'payment', to: RECIPIENT, amount: 1_000_000_000_000n }, createContext());
        const explained = explainDotTransaction({ txHex: tx.toBroadcastFormat(), material, senderAddress: SENDER });
        assert.strictEqual(explained.fee.fee, '0');
      });
    });

    describe('displayOrder', function () {
      it('should always include standard display order fields', function () {
        const tx = buildTransaction({ type: 'payment', to: RECIPIENT, amount: 1n }, createContext());
        const explained = explainDotTransaction({ txHex: tx.toBroadcastFormat(), material, senderAddress: SENDER });
        const expected = ['outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type', 'sequenceId', 'id'];
        assert.deepStrictEqual(explained.displayOrder, expected);
      });
    });
  });
});
