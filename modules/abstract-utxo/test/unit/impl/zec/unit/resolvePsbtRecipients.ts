import assert from 'node:assert/strict';

import { address as wasmAddress, fixedScriptWallet } from '@bitgo/wasm-utxo';

import { resolvePsbtRecipients } from '../../../../../src/impl/zec/recipients';
import { getDefaultWasmWalletKeys } from '../../../util';

// ZIP-316 unified-address test vector, copied from
// BitGoWASM/packages/wasm-utxo/test/fixtures/zcash/unified_address.json so both repos test
// against the same known-good data.
const testnetWallet = {
  unified:
    'utest1w5m0qcnp8egl8qa296n70n8nvj0tqnzk90p7f48v7mjhhdrdqs8vgqydslg5plmzefawefnpmgmlm6hcy38m972erwxs04s02cq2prhguz8kqly75m6zjy56m08d5jnycgtpqtjeprte576gkmrxyszepgx76yzuwhh7m4lfz9jaq7unjk0x5ant46juxz73hsc6q4v3dqtzww00vps',
  transparentAddress: 'tmM4DvLVJKXZt5ydn1tqYTHvahpKSwgjuRk',
};
const IRONWOOD_HEIGHT = 4200000; // after the NU6.3 testnet activation (4134000)
const IRONWOOD_RECEIVER = Buffer.from(
  'd632c28aa0831d671be17709a42c9627e2eb687a1b2a55768ea470c9bae7499cd0bd3d0eb0484e307236b5',
  'hex'
);

describe('resolvePsbtRecipients', function () {
  const { walletKeys } = getDefaultWasmWalletKeys();

  function buildV4Psbt(unifiedAddress?: string): fixedScriptWallet.ZcashBitGoPsbt {
    const psbt = fixedScriptWallet.ZcashBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 3146400 });
    psbt.addWalletInput({ txid: '22'.repeat(32), vout: 0, value: 200000n }, walletKeys, {
      scriptId: { chain: 0, index: 1 },
    });
    psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 100000n });
    const externalScript = wasmAddress.toOutputScriptWithCoin(testnetWallet.transparentAddress, 'tzec');
    psbt.addTransparentOutput(externalScript, 12345n, unifiedAddress);
    return psbt;
  }

  function buildV6Psbt(unifiedAddress?: string): fixedScriptWallet.ZcashIronwoodBitGoPsbt {
    const psbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.createEmpty('tzec', walletKeys, {
      blockHeight: IRONWOOD_HEIGHT,
    });
    psbt.addWalletInput({ txid: '11'.repeat(32), vout: 0, value: 100000n }, walletKeys, {
      scriptId: { chain: 0, index: 0 },
    });
    psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 90000n });
    psbt.addShieldedOutputs(
      [{ recipient: new Uint8Array(IRONWOOD_RECEIVER), amount: 5000n, unifiedAddress }],
      new Uint8Array(32) // all-zero anchor, as in the utxo-core shielded build tests
    );
    return psbt;
  }

  it('resolves external transparent outputs and excludes wallet change (v4)', function () {
    const recipients = resolvePsbtRecipients(buildV4Psbt(), walletKeys);
    assert.strictEqual(recipients.length, 1);
    const recipient = recipients[0];
    assert.strictEqual(recipient.destination.kind, 'transparent');
    assert.strictEqual(recipient.address, testnetWallet.transparentAddress);
    assert.strictEqual(recipient.amount, 12345n);
    assert.strictEqual(recipient.unifiedAddress, undefined);
    assert.deepStrictEqual(
      Buffer.from(recipient.script),
      Buffer.from(wasmAddress.toOutputScriptWithCoin(testnetWallet.transparentAddress, 'tzec'))
    );
  });

  it('reports the original UA verbatim for a transparent output built from a Unified Address (v4)', function () {
    const recipients = resolvePsbtRecipients(buildV4Psbt(testnetWallet.unified), walletKeys);
    assert.strictEqual(recipients.length, 1);
    const recipient = recipients[0];
    assert.deepStrictEqual(recipient.destination, {
      kind: 'zcashUnifiedTransparent',
      unifiedAddress: testnetWallet.unified,
    });
    assert.strictEqual(recipient.unifiedAddress, testnetWallet.unified);
    // For a transparent output built from a Unified Address, the parsed address is the UA
    // itself (verbatim), not just the transparent receiver.
    assert.strictEqual(recipient.address, testnetWallet.unified);
  });

  it('resolves a shielded v6 output to its (re-encoded) Orchard Unified Address recipient', function () {
    const recipients = resolvePsbtRecipients(buildV6Psbt(), walletKeys);
    assert.strictEqual(recipients.length, 1);
    const recipient = recipients[0];
    const expectedAddress = fixedScriptWallet.ZcashUnifiedAddress.encodeOrchardReceiver(
      new Uint8Array(IRONWOOD_RECEIVER),
      'tzec'
    );
    assert.deepStrictEqual(recipient.destination, {
      kind: 'zcashShielded',
      unifiedAddress: expectedAddress,
    });
    assert.strictEqual(recipient.address, expectedAddress);
    assert.strictEqual(recipient.amount, 5000n);
    assert.deepStrictEqual(Buffer.from(recipient.script), IRONWOOD_RECEIVER);
  });

  it('reports the original UA verbatim for a shielded output built from a Unified Address (v6)', function () {
    const orchardOnlyUa = fixedScriptWallet.ZcashUnifiedAddress.encodeOrchardReceiver(
      new Uint8Array(IRONWOOD_RECEIVER),
      'tzec'
    );
    const recipients = resolvePsbtRecipients(buildV6Psbt(orchardOnlyUa), walletKeys);
    assert.strictEqual(recipients.length, 1);
    const recipient = recipients[0];
    assert.deepStrictEqual(recipient.destination, { kind: 'zcashShielded', unifiedAddress: orchardOnlyUa });
    assert.strictEqual(recipient.unifiedAddress, orchardOnlyUa);
    assert.strictEqual(recipient.address, orchardOnlyUa);
  });
});
