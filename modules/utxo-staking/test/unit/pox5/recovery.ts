import assert from 'assert/strict';
import { createHash } from 'crypto';

import { pox5 } from '@bitgo/utxo-descriptors';
import { Psbt, type Descriptor } from '@bitgo/wasm-utxo';
import { getKey, getKeyTriple } from '@bitgo/wasm-utxo/testutils';

import {
  assertPox5EarlyExitSpend,
  assertPox5LocktimeSpend,
  classifyPox5Spend,
  POX5_MAX_UNLOCK_HEIGHT,
  preparePox5EarlyExit,
} from '../../../src/pox5';

type Pox5InputMatch = pox5.Pox5InputMatch;

const UNLOCK_HEIGHT = 840_000;

function sha256(value: Uint8Array): Buffer {
  return createHash('sha256').update(value).digest();
}

function createPox5RecoveryPsbt(
  lockTime: number,
  sequence = 0xfffffffe,
  unlockHeight = UNLOCK_HEIGHT
): {
  psbt: Psbt;
  match: Pox5InputMatch;
  principalPreimage: Buffer;
} {
  const [user, backup, bitgo] = getKeyTriple('utxo-staking-pox5-recovery');
  const earlyExit = getKey('utxo-staking-pox5-recovery-early-exit');
  const principalPreimage = Buffer.alloc(32, 0x42);
  const descriptor = pox5.createPox5LockupDescriptor({
    unlockHeight,
    stakerCommitment: sha256(principalPreimage),
    earlyExitKey: Buffer.from(earlyExit.publicKey),
    stakerKeys: [Buffer.from(user.publicKey), Buffer.from(backup.publicKey), Buffer.from(bitgo.publicKey)],
  });
  const concreteDescriptor = descriptor as Descriptor;
  const psbt = Psbt.create(2, lockTime);
  psbt.addInput('01'.repeat(32), 0, 100_000n, concreteDescriptor.scriptPubkey(), sequence);
  psbt.addOutput(concreteDescriptor.scriptPubkey(), 90_000n);
  psbt.updateInputWithDescriptor(0, concreteDescriptor);

  const match = pox5.matchPox5Input(psbt, 0, new Map([['pox5', concreteDescriptor]]));
  assert.ok(match);
  return { psbt, match: match as Pox5InputMatch, principalPreimage };
}

describe('PoX-5 spend policy', function () {
  it('classifies locktime and early-exit branches from native transaction data', function () {
    const locktimeSpend = createPox5RecoveryPsbt(UNLOCK_HEIGHT);
    const earlyExitSpend = createPox5RecoveryPsbt(0);

    assert.equal(classifyPox5Spend(locktimeSpend.psbt, locktimeSpend.match), 'locktime');
    assert.equal(classifyPox5Spend(earlyExitSpend.psbt, earlyExitSpend.match), 'early-exit');
    assert.doesNotThrow(() => assertPox5LocktimeSpend(locktimeSpend.psbt, [locktimeSpend.match]));
    assert.doesNotThrow(() => assertPox5EarlyExitSpend(earlyExitSpend.psbt, earlyExitSpend.match));
    assert.throws(() => assertPox5EarlyExitSpend(locktimeSpend.psbt, locktimeSpend.match), /not an early-exit spend/);
  });

  it('enforces the block-height and unlock-height boundaries', function () {
    const atHeight = createPox5RecoveryPsbt(UNLOCK_HEIGHT);
    const aboveHeight = createPox5RecoveryPsbt(UNLOCK_HEIGHT + 1);
    const belowHeight = createPox5RecoveryPsbt(UNLOCK_HEIGHT - 1);
    const timestampLocktime = createPox5RecoveryPsbt(POX5_MAX_UNLOCK_HEIGHT);

    assert.doesNotThrow(() => assertPox5LocktimeSpend(atHeight.psbt, [atHeight.match]));
    assert.doesNotThrow(() => assertPox5LocktimeSpend(aboveHeight.psbt, [aboveHeight.match]));
    assert.throws(() => assertPox5LocktimeSpend(belowHeight.psbt, [belowHeight.match]), /at least/);
    assert.throws(
      () => assertPox5LocktimeSpend(timestampLocktime.psbt, [timestampLocktime.match]),
      /block height below/
    );
  });

  it('requires non-final sequences for locktime spends', function () {
    const final = createPox5RecoveryPsbt(UNLOCK_HEIGHT, 0xffffffff);
    const nonFinal = createPox5RecoveryPsbt(UNLOCK_HEIGHT, 0xfffffffe);

    assert.throws(() => assertPox5LocktimeSpend(final.psbt, [final.match]), /non-final sequences/);
    assert.doesNotThrow(() => assertPox5LocktimeSpend(nonFinal.psbt, [nonFinal.match]));
  });

  it('adds a validated principal preimage through the native PSBT API', function () {
    const earlyExitSpend = createPox5RecoveryPsbt(0);

    preparePox5EarlyExit(earlyExitSpend.psbt, 0, earlyExitSpend.match, earlyExitSpend.principalPreimage);

    const records = earlyExitSpend.psbt
      .getInputKeyValues(0)
      .filter((record) => record.type === 'known' && record.key === 'PSBT_IN_SHA256');
    assert.equal(records.length, 1);
    const [record] = records;
    assert.deepStrictEqual(Buffer.from(record.keyData), sha256(earlyExitSpend.principalPreimage));
    assert.deepStrictEqual(Buffer.from(record.value), earlyExitSpend.principalPreimage);
  });
});
