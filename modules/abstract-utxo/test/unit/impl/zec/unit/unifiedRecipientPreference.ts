import assert from 'node:assert/strict';

import { fixedScriptWallet } from '@bitgo/wasm-utxo';

import { getUnifiedRecipientPreference } from '../../../../../src/impl/zec/recipients';

// ZIP-316 unified-address test vectors, copied from
// BitGoWASM/packages/wasm-utxo/test/fixtures/zcash/unified_address.json so
// both repos test against the same known-good data.
const zip316Mainnet = {
  unified:
    'u1pg2aaph7jp8rpf6yhsza25722sg5fcn3vaca6ze27hqjw7jvvhhuxkpcg0ge9xh6drsgdkda8qjq5chpehkcpxf87rnjryjqwymdheptpvnljqqrjqzjwkc2ma6hcq666kgwfytxwac8eyex6ndgr6ezte66706e3vaqrd25dzvzkc69kw0jgywtd0cmq52q5lkw6uh7hyvzjse8ksx',
};
const testnetWallet = {
  unified:
    'utest1w5m0qcnp8egl8qa296n70n8nvj0tqnzk90p7f48v7mjhhdrdqs8vgqydslg5plmzefawefnpmgmlm6hcy38m972erwxs04s02cq2prhguz8kqly75m6zjy56m08d5jnycgtpqtjeprte576gkmrxyszepgx76yzuwhh7m4lfz9jaq7unjk0x5ant46juxz73hsc6q4v3dqtzww00vps',
  transparentAddress: 'tmM4DvLVJKXZt5ydn1tqYTHvahpKSwgjuRk',
};

describe('getUnifiedRecipientPreference', function () {
  function orchardOnlyUa(network: 'zec' | 'tzec'): string {
    return fixedScriptWallet.ZcashUnifiedAddress.encodeOrchardReceiver(new Uint8Array(43).fill(0x42), network);
  }

  it('returns undefined for no recipients', function () {
    assert.strictEqual(getUnifiedRecipientPreference('tzec', []), undefined);
  });

  it('returns undefined for an ordinary transparent address', function () {
    assert.strictEqual(
      getUnifiedRecipientPreference('tzec', [{ address: testnetWallet.transparentAddress }]),
      undefined
    );
  });

  it('returns undefined for a raw-script recipient with no address', function () {
    assert.strictEqual(getUnifiedRecipientPreference('tzec', [{ address: undefined }]), undefined);
  });

  it("returns 'shielded' for an Orchard-only Unified Address", function () {
    assert.strictEqual(getUnifiedRecipientPreference('tzec', [{ address: orchardOnlyUa('tzec') }]), 'shielded');
  });

  it("infers 'shielded' on mainnet", function () {
    assert.strictEqual(getUnifiedRecipientPreference('zec', [{ address: orchardOnlyUa('zec') }]), 'shielded');
  });

  it('classifies a Unified Address carrying transparent + Orchard receivers as transparent', function () {
    // Both official vectors carry a transparent receiver alongside the Orchard one, so the
    // transparent-first classification applies even though they also classify as shielded.
    assert.strictEqual(getUnifiedRecipientPreference('tzec', [{ address: testnetWallet.unified }]), undefined);
    assert.strictEqual(getUnifiedRecipientPreference('zec', [{ address: zip316Mainnet.unified }]), undefined);
  });

  it('fails hard for an unrecognizable address instead of defaulting to transparent', function () {
    assert.throws(() => getUnifiedRecipientPreference('tzec', [{ address: 'not-an-address' }]));
  });

  it('fails hard for a unified address on the wrong network', function () {
    assert.throws(() => getUnifiedRecipientPreference('tzec', [{ address: zip316Mainnet.unified }]));
  });

  it('rejects a mix of shielded and transparent recipients', function () {
    assert.throws(
      () =>
        getUnifiedRecipientPreference('tzec', [
          { address: orchardOnlyUa('tzec') },
          { address: testnetWallet.transparentAddress },
        ]),
      /Mixed shielded and transparent recipients/
    );
  });
});
