import assert from 'assert/strict';
import { createHash } from 'crypto';

import { Descriptor, descriptorWallet, Psbt } from '@bitgo/wasm-utxo';
import { getKey, getKeyTriple } from '@bitgo/wasm-utxo/testutils';

import {
  createPox5LockupDescriptor,
  descriptorExtension,
  isWalletPox5Lockup,
  assertPox5SpendPolicy,
} from '../../../src/pox5';
import type { WalletKeyTriple } from '../../../src/extension';

const UNLOCK_HEIGHT = 840_000;

function lockupFor(keys: WalletKeyTriple): Descriptor {
  return createPox5LockupDescriptor({
    unlockHeight: UNLOCK_HEIGHT,
    stakerCommitment: createHash('sha256').update(Buffer.alloc(32, 0x42)).digest(),
    earlyExitKey: Buffer.from(getKey('pox5-extension-early-exit').publicKey),
    stakerKeys: [keys[0].neutered(), keys[1].neutered(), keys[2].neutered()],
  });
}

function toWalletKeys(label: string): WalletKeyTriple {
  const [a, b, c] = getKeyTriple(label);
  return [a, b, c];
}

function createSpend(
  lockup: Descriptor,
  locktime: number
): { psbt: Psbt; descriptorMap: descriptorWallet.DescriptorMap } {
  const concrete = lockup.atDerivationIndex(0);
  const psbt = Psbt.create(2, locktime);
  psbt.addInput('01'.repeat(32), 0, 100_000n, concrete.scriptPubkey(), 0xfffffffe);
  psbt.addOutput(concrete.scriptPubkey(), 90_000n);
  psbt.updateInputWithDescriptor(0, concrete);
  return { psbt, descriptorMap: new Map([['pox5', lockup]]) };
}

describe('PoX-5 descriptor extension', function () {
  const walletKeys = toWalletKeys('pox5-extension');

  it('is named pox5', function () {
    assert.equal(descriptorExtension.name, 'pox5');
  });

  describe('isWalletDescriptor', function () {
    it('accepts the canonical lockup descriptor over the wallet keys', function () {
      assert.ok(isWalletPox5Lockup(lockupFor(walletKeys), walletKeys));
      assert.ok(descriptorExtension.isWalletDescriptor(lockupFor(walletKeys), walletKeys));
    });

    it('rejects a lockup descriptor over other keys', function () {
      assert.equal(isWalletPox5Lockup(lockupFor(toWalletKeys('pox5-extension-foreign')), walletKeys), false);
    });

    it('rejects a lockup descriptor with permuted wallet keys', function () {
      assert.equal(isWalletPox5Lockup(lockupFor([walletKeys[1], walletKeys[0], walletKeys[2]]), walletKeys), false);
    });

    it('rejects descriptors that are not lockup descriptors', function () {
      const xpubs = walletKeys.map((k) => k.neutered().toBase58() + '/*');
      const other = Descriptor.fromString(`wsh(multi(2,${xpubs.join(',')}))`, 'derivable');
      assert.equal(isWalletPox5Lockup(other, walletKeys), false);
    });
  });

  describe('assertSpendPolicy', function () {
    it('does nothing for a PSBT without PoX-5 lockup inputs', function () {
      const xpubs = walletKeys.map((k) => k.neutered().toBase58() + '/*');
      const other = Descriptor.fromString(`wsh(multi(2,${xpubs.join(',')}))`, 'derivable');
      const { psbt, descriptorMap } = createSpend(other, 0);
      assert.doesNotThrow(() => descriptorExtension.assertSpendPolicy(psbt, descriptorMap));
    });

    it('accepts a late exit at the unlock height', function () {
      const { psbt, descriptorMap } = createSpend(lockupFor(walletKeys), UNLOCK_HEIGHT);
      assert.doesNotThrow(() => descriptorExtension.assertSpendPolicy(psbt, descriptorMap));
    });

    it('refuses a late exit below the unlock height', function () {
      const { psbt, descriptorMap } = createSpend(lockupFor(walletKeys), UNLOCK_HEIGHT - 1);
      assert.throws(() => descriptorExtension.assertSpendPolicy(psbt, descriptorMap), /nLockTime must be at least/);
    });

    it('delegates to the PoX-5 spend policy', function () {
      assert.equal(descriptorExtension.assertSpendPolicy, assertPox5SpendPolicy);
    });
  });
});
