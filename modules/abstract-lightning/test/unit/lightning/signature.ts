import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';

import { createMessageSignature, verifyMessageSignature } from '../../../src/lightning';
import crypto from 'crypto';

type Request = {
  invoice: string;
  fee?: number;
};

function getKey(seed: string): utxolib.BIP32Interface {
  return utxolib.bip32.fromSeed(crypto.createHash('sha256').update(seed).digest());
}

describe('verifySignature', function () {
  const key = getKey('key');
  const keyPub = key.neutered();
  const wrongKey = getKey('wrongKey');

  it('returns true on valid signature', function () {
    const request: Request = {
      invoice: 'some data',
    };
    const signature = createMessageSignature(request, key.toBase58());
    const result = verifyMessageSignature(request, signature, keyPub.toBase58());
    assert(result);
  });

  it('returns true on different order', function () {
    const request: Request = {
      invoice: 'some data',
      fee: 123,
    };
    const otherRequest: Request = {
      fee: 123,
      invoice: 'some data',
    };
    const signature = createMessageSignature(request, key.toBase58());
    const result = verifyMessageSignature(otherRequest, signature, keyPub.toBase58());
    assert(result);
  });

  it('returns false on wrong message', function () {
    const request: Request = {
      invoice: 'some data',
    };
    const wrongRequest: Request = {
      invoice: 'some other data',
    };
    const signature = createMessageSignature(request, key.toBase58());
    const result = verifyMessageSignature(wrongRequest, signature, keyPub.toBase58());
    assert(!result);
  });

  it('returns false on wrong key', function () {
    const request: Request = {
      invoice: 'some data',
    };
    const signature = createMessageSignature(request, wrongKey.toBase58());
    const result = verifyMessageSignature(request, signature, keyPub.toBase58());
    assert(!result);
  });
});
