import assert from 'node:assert/strict';

import { BitGoAPI } from '@bitgo/sdk-api';

import {
  Zec,
  Tzec,
  getZcashAddressKind,
  isShieldedZcashAddress,
  isValidZcashAddress,
} from '../../../../../src/impl/zec';

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

describe('Zcash address validation', function () {
  let bitgo: BitGoAPI;
  let zec;
  let tzec;

  before(function () {
    bitgo = new BitGoAPI({ env: 'mock' });
    bitgo.register('zec', Zec.createInstance);
    bitgo.register('tzec', Tzec.createInstance);
    zec = bitgo.coin('zec');
    tzec = bitgo.coin('tzec');
  });

  it('recognizes a mainnet unified address as shielded', function () {
    assert.strictEqual(zec.isValidAddress(zip316Mainnet.unified), true);
    assert.strictEqual(getZcashAddressKind(zip316Mainnet.unified, 'zec'), 'shielded');
    assert.strictEqual(isShieldedZcashAddress(zip316Mainnet.unified, 'zec'), true);
    assert.strictEqual(isValidZcashAddress(zip316Mainnet.unified, 'zec'), true);
  });

  it('recognizes a testnet unified address as shielded', function () {
    assert.strictEqual(tzec.isValidAddress(testnetWallet.unified), true);
    assert.strictEqual(getZcashAddressKind(testnetWallet.unified, 'tzec'), 'shielded');
    assert.strictEqual(isShieldedZcashAddress(testnetWallet.unified, 'tzec'), true);
    assert.strictEqual(isValidZcashAddress(testnetWallet.unified, 'tzec'), true);
  });

  it('recognizes a testnet transparent address as transparent', function () {
    assert.strictEqual(tzec.isValidAddress(testnetWallet.transparentAddress), true);
    assert.strictEqual(getZcashAddressKind(testnetWallet.transparentAddress, 'tzec'), 'transparent');
    assert.strictEqual(isValidZcashAddress(testnetWallet.transparentAddress, 'tzec'), true);
  });

  it('recognizes a mainnet transparent (P2PKH) address as transparent', function () {
    const address = 't1cN2ZVWzWcVRrnfeQzmkpLhzQ4dYRv8yRY';
    assert.strictEqual(zec.isValidAddress(address), true);
    assert.strictEqual(getZcashAddressKind(address, 'zec'), 'transparent');
    assert.strictEqual(isValidZcashAddress(address, 'zec'), true);
  });

  it('rejects a garbage string', function () {
    const garbage = 'not-a-real-address';
    assert.strictEqual(zec.isValidAddress(garbage), false);
    assert.strictEqual(getZcashAddressKind(garbage, 'zec'), undefined);
    assert.strictEqual(isValidZcashAddress(garbage, 'zec'), false);
  });

  it('rejects a unified address checked against the wrong network', function () {
    assert.strictEqual(tzec.isValidAddress(zip316Mainnet.unified), false);
    assert.strictEqual(getZcashAddressKind(zip316Mainnet.unified, 'tzec'), undefined);
    assert.strictEqual(isShieldedZcashAddress(zip316Mainnet.unified, 'tzec'), false);
    assert.strictEqual(isValidZcashAddress(zip316Mainnet.unified, 'tzec'), false);
  });
});
