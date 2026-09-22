import assert from 'node:assert/strict';

import { fixedScriptWallet } from '@bitgo/wasm-utxo';

import { assertShieldedWalletAddress } from '../../../../../src/impl/zec';

// ZIP-316 unified-address test vector, copied from
// BitGoWASM/packages/wasm-utxo/test/fixtures/zcash/unified_address.json so
// both repos test against the same known-good data.
const testnetWallet = {
  unified:
    'utest1w5m0qcnp8egl8qa296n70n8nvj0tqnzk90p7f48v7mjhhdrdqs8vgqydslg5plmzefawefnpmgmlm6hcy38m972erwxs04s02cq2prhguz8kqly75m6zjy56m08d5jnycgtpqtjeprte576gkmrxyszepgx76yzuwhh7m4lfz9jaq7unjk0x5ant46juxz73hsc6q4v3dqtzww00vps',
  transparentAddress: 'tmM4DvLVJKXZt5ydn1tqYTHvahpKSwgjuRk',
};

const toHex = (bytes: Uint8Array): string => Buffer.from(bytes).toString('hex');

/** Wallet-platform style `coinSpecific.shielded` derived from the UA itself. */
function shieldedCoinSpecificFor(address: string, network: fixedScriptWallet.ZcashNetworkName) {
  const orchard = fixedScriptWallet.ZcashUnifiedAddress.parse(address, network).orchardReceiver!;
  return {
    shielded: {
      type: 'ironwood',
      diversifier: toHex(orchard.slice(0, 11)),
      pkD: toHex(orchard.slice(11)),
      diversifierIndex: 0,
    },
  };
}

describe('assertShieldedWalletAddress', function () {
  const coinSpecific = shieldedCoinSpecificFor(testnetWallet.unified, 'tzec');

  it('accepts a unified address whose Orchard receiver matches the reported diversifier/pkD', function () {
    assertShieldedWalletAddress('tzec', { address: testnetWallet.unified, coinSpecific });
  });

  it('rejects a unified address whose Orchard receiver does not match the reported pkD', function () {
    assert.throws(
      () =>
        assertShieldedWalletAddress('tzec', {
          address: testnetWallet.unified,
          coinSpecific: { shielded: { ...coinSpecific.shielded, pkD: '00'.repeat(32) } },
        }),
      /Orchard receiver does not match/
    );
  });

  it('rejects when shielded coinSpecific is missing', function () {
    assert.throws(() => assertShieldedWalletAddress('tzec', { address: testnetWallet.unified }), /missing diversifier/);
  });

  it('rejects malformed diversifier/pkD lengths', function () {
    assert.throws(
      () =>
        assertShieldedWalletAddress('tzec', {
          address: testnetWallet.unified,
          coinSpecific: { shielded: { ...coinSpecific.shielded, diversifier: '00' } },
        }),
      /invalid diversifier length/
    );
    assert.throws(
      () =>
        assertShieldedWalletAddress('tzec', {
          address: testnetWallet.unified,
          coinSpecific: { shielded: { ...coinSpecific.shielded, pkD: '00' } },
        }),
      /invalid pkD length/
    );
  });

  it('rejects an address that is not a unified address', function () {
    assert.throws(
      () => assertShieldedWalletAddress('tzec', { address: testnetWallet.transparentAddress, coinSpecific }),
      /not a valid unified address/
    );
  });
});
