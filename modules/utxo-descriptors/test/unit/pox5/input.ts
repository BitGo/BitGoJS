import * as assert from 'assert';
import { createHash } from 'crypto';

import { bip32, descriptorWallet, Psbt } from '@bitgo/wasm-utxo';
import { getKeyTriple } from '@bitgo/wasm-utxo/testutils';

import {
  createPox5LockupDescriptor,
  derivePox5StakerKeys,
  findPox5DescriptorForInput,
  matchPox5Input,
  Pox5LockupDescriptorParams,
} from '../../../src/pox5';

const UNLOCK_HEIGHT = 840_000;
type BIP32Interface = bip32.BIP32Interface;
type Pox5Bip32Params = Omit<Pox5LockupDescriptorParams, 'stakerKeys'> & {
  stakerKeys: [BIP32Interface, BIP32Interface, BIP32Interface];
};

function sha256(value: Uint8Array): Buffer {
  return createHash('sha256').update(value).digest();
}

function getParams(): Pox5Bip32Params {
  const stakerKeys = getKeyTriple('utxo-descriptors-pox5');
  return {
    unlockHeight: UNLOCK_HEIGHT,
    stakerCommitment: sha256(Buffer.alloc(32, 0x42)),
    earlyExitKey: Buffer.from(stakerKeys[0].derive(9).publicKey),
    stakerKeys,
  };
}

function createInputPsbt(descriptor: ReturnType<typeof createPox5LockupDescriptor>): Psbt {
  return descriptorWallet.createPsbt(
    { version: 2, locktime: 0 },
    [
      {
        hash: '01'.repeat(32),
        index: 0,
        witnessUtxo: { script: descriptor.scriptPubkey(), value: 100_000n },
        descriptor,
      },
    ],
    []
  );
}

describe('PoX-5 input resolution', function () {
  it('matches a definite descriptor without derivation metadata', function () {
    const descriptor = createPox5LockupDescriptor({
      ...getParams(),
      stakerKeys: derivePox5StakerKeys(getParams().stakerKeys, 0),
    });
    const psbt = Psbt.create(2, 0);
    psbt.addInput('01'.repeat(32), 0, 100_000n, descriptor.scriptPubkey());
    const match = matchPox5Input(psbt, 0, new Map([['lockup', descriptor]]));

    assert.ok(match);
    assert.strictEqual(match.index, undefined);
    assert.strictEqual(match.descriptor.toString(), descriptor.toString());
    assert.deepStrictEqual(match.info.stakerKeys, derivePox5StakerKeys(getParams().stakerKeys, 0));
  });

  it('matches a derived descriptor while ignoring foreign root derivations', function () {
    const params = getParams();
    const descriptor = createPox5LockupDescriptor(params);
    const concreteDescriptor = descriptor.atDerivationIndex(4);
    const psbt = createInputPsbt(concreteDescriptor);
    const match = matchPox5Input(psbt, 0, new Map([['lockup', descriptor]]));

    assert.ok(match);
    assert.strictEqual(match.index, 4);
    assert.strictEqual(match.descriptor.toString(), concreteDescriptor.toString());
    assert.deepStrictEqual(match.info.stakerKeys, derivePox5StakerKeys(params.stakerKeys, 4));
    assert.ok(psbt.getInputs()[0]?.bip32Derivation.some((derivation) => derivation.path === ''));
  });

  it('returns no match when the input has no usable derivation metadata', function () {
    const params = getParams();
    const descriptor = createPox5LockupDescriptor(params);
    const concreteDescriptor = descriptor.atDerivationIndex(4);
    const input = {
      witnessUtxo: { script: concreteDescriptor.scriptPubkey(), value: 100_000n },
      bip32Derivation: [],
      tapBip32Derivation: [],
    };

    assert.strictEqual(findPox5DescriptorForInput(input, new Map([['lockup', descriptor]])), undefined);
  });

  it('returns no match for a noncanonical descriptor', function () {
    const params = getParams();
    const pox5Descriptor = createPox5LockupDescriptor(params);
    const psbt = Psbt.create(2, 0);
    psbt.addInput('01'.repeat(32), 0, 100_000n, pox5Descriptor.atDerivationIndex(0).scriptPubkey());
    const nonPox5Descriptor = createPox5LockupDescriptor({
      ...params,
      unlockHeight: UNLOCK_HEIGHT + 1,
    }).atDerivationIndex(0);

    assert.strictEqual(matchPox5Input(psbt, 0, new Map([['other', nonPox5Descriptor]])), undefined);
  });
});
