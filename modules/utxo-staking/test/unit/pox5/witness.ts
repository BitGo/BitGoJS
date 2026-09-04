import * as assert from 'assert';
import { createHash } from 'crypto';

import { pox5 } from '@bitgo/utxo-descriptors';
import { Psbt, type Descriptor } from '@bitgo/wasm-utxo';
import { getKey, getKeyTriple } from '@bitgo/wasm-utxo/testutils';

import { finalizePox5EarlyExitPath, finalizePox5LocktimePath, Pox5FinalizerParams } from '../../../src/pox5';

const UNLOCK_HEIGHT = 840_000;

function sha256(value: Uint8Array): Buffer {
  return createHash('sha256').update(value).digest();
}

function createPox5Psbt(
  lockTime: number,
  includeEarlyExitSignature: boolean
): {
  psbt: Psbt;
  params: Pox5FinalizerParams;
  principalPreimage: Buffer;
} {
  const [user, backup, bitgo] = getKeyTriple('utxo-staking-pox5');
  const earlyExit = getKey('utxo-staking-pox5-early-exit');
  const principalPreimage = Buffer.alloc(32, 0x42);
  const stakerKeys = [Buffer.from(user.publicKey), Buffer.from(backup.publicKey), Buffer.from(bitgo.publicKey)] as [
    Buffer,
    Buffer,
    Buffer
  ];
  const params: Pox5FinalizerParams = {
    descriptor: pox5.createPox5LockupDescriptor({
      unlockHeight: UNLOCK_HEIGHT,
      stakerCommitment: sha256(principalPreimage),
      earlyExitKey: Buffer.from(earlyExit.publicKey),
      stakerKeys,
    }),
    stakerKeys,
  };
  const descriptor = params.descriptor as Descriptor;
  const scriptPubKey = descriptor.scriptPubkey();
  const psbt = Psbt.create(2, lockTime);
  psbt.addInput('01'.repeat(32), 0, 100_000n, scriptPubKey, 0xfffffffe);
  psbt.addOutput(scriptPubKey, 90_000n);
  psbt.updateInputWithDescriptor(0, descriptor);

  for (const key of includeEarlyExitSignature ? [user, backup, earlyExit] : [user, backup]) {
    assert.ok(key.privateKey, 'test key must include private key material');
    psbt.signWithPrv(key.privateKey);
  }
  return { psbt, params, principalPreimage };
}

describe('PoX-5 witness finalization', function () {
  it('finalizes the CLTV branch through the native Miniscript finalizer', function () {
    const { psbt, params } = createPox5Psbt(UNLOCK_HEIGHT, false);

    finalizePox5LocktimePath(psbt, 0, params);

    assert.deepStrictEqual(psbt.getPartialSignatures(0), []);
    assert.ok(psbt.extractTransaction().toBytes().length > 0);
  });

  it('registers the principal preimage and finalizes the early-exit branch', function () {
    const { psbt, params, principalPreimage } = createPox5Psbt(0, true);

    assert.throws(
      () => finalizePox5EarlyExitPath(psbt, 0, { ...params, principalPreimage: Buffer.alloc(32) }),
      /principalPreimage/
    );
    finalizePox5EarlyExitPath(psbt, 0, { ...params, principalPreimage });

    assert.deepStrictEqual(psbt.getPartialSignatures(0), []);
    assert.ok(psbt.extractTransaction().toBytes().length > 0);
  });
});
