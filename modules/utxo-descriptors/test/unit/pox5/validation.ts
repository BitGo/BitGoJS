import * as assert from 'assert';
import { createHash } from 'crypto';

import { Psbt } from '@bitgo/wasm-utxo';
import { getKeyTriple } from '@bitgo/wasm-utxo/testutils';

import {
  assertPox5PrincipalPreimage,
  createPox5LockupDescriptor,
  getPox5PrincipalPreimage,
  Pox5LockupDescriptorParams,
  parsePox5LockupDescriptor,
} from '../../../src/pox5';

function sha256(value: Uint8Array): Buffer {
  return createHash('sha256').update(value).digest();
}

function getParams(stakerCommitment: Buffer): Pox5LockupDescriptorParams {
  const stakerKeys = getKeyTriple('utxo-descriptors-pox5-validation');
  return {
    unlockHeight: 840_000,
    stakerCommitment,
    earlyExitKey: Buffer.from(stakerKeys[0].derive(9).publicKey),
    stakerKeys: [
      Buffer.from(stakerKeys[0].publicKey),
      Buffer.from(stakerKeys[1].publicKey),
      Buffer.from(stakerKeys[2].publicKey),
    ],
  };
}

function createPsbt(): Psbt {
  const psbt = Psbt.create(2, 0);
  psbt.addInput('01'.repeat(32), 0, 100_000n, new Uint8Array(34));
  psbt.addOutput(new Uint8Array([0x6a]), 0n);
  return psbt;
}

describe('PoX-5 principal preimage validation', function () {
  it('extracts and validates the unique native SHA256 record', function () {
    const preimage = Buffer.alloc(32, 0x42);
    const psbt = createPsbt();
    psbt.addSha256Preimage(0, preimage);

    assert.deepStrictEqual(getPox5PrincipalPreimage(psbt, 0), preimage);
  });

  it('rejects missing and duplicate SHA256 records', function () {
    assert.throws(() => getPox5PrincipalPreimage(createPsbt(), 0), /exactly one/);

    const psbt = createPsbt();
    psbt.addSha256Preimage(0, Buffer.alloc(32, 0x42));
    psbt.addSha256Preimage(0, Buffer.alloc(32, 0x43));
    assert.throws(() => getPox5PrincipalPreimage(psbt, 0), /exactly one/);
  });

  it('rejects malformed SHA256 digest and preimage values', function () {
    const psbt = createPsbt();
    psbt.setInputKV(0, { type: 'unknown', keyType: 0x0b, data: new Uint8Array(32) }, new Uint8Array(31));
    assert.throws(() => getPox5PrincipalPreimage(psbt, 0), /preimage must be 32 bytes/);
  });

  it('checks the principal preimage against the descriptor commitment', function () {
    const preimage = Buffer.alloc(32, 0x42);
    const descriptor = createPox5LockupDescriptor(getParams(sha256(preimage)));
    const info = parsePox5LockupDescriptor(descriptor);
    assert.ok(info);

    assert.doesNotThrow(() => assertPox5PrincipalPreimage(info, preimage));
    assert.throws(() => assertPox5PrincipalPreimage(info, Buffer.alloc(32, 0x43)), /does not match/);
  });
});
