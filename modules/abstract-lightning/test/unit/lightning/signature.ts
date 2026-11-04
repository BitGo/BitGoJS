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

describe('signatures on the testnet network', function () {
  const request: Request = { invoice: 'some data' };
  const key = getKey('testnet key');
  // the same key re-encoded with testnet (tprv/tpub) version bytes
  const testnetKey = utxolib.bip32.fromPrivateKey(key.privateKey as Buffer, key.chainCode, utxolib.networks.testnet);

  it('signs and verifies with xprv/xpub keys, as tlnbtc keys are generated with bitcoin versions', function () {
    const signature = createMessageSignature(request, key.toBase58(), utxolib.networks.testnet);
    assert(verifyMessageSignature(request, signature, key.neutered().toBase58(), utxolib.networks.testnet));
  });

  it('produces the same signature as the default network (message prefix is identical)', function () {
    const testnetSignature = createMessageSignature(request, key.toBase58(), utxolib.networks.testnet);
    const bitcoinSignature = createMessageSignature(request, key.toBase58());
    assert.strictEqual(testnetSignature, bitcoinSignature);
    assert(verifyMessageSignature(request, testnetSignature, key.neutered().toBase58()));
  });

  it('still parses tprv/tpub keys with the testnet network', function () {
    assert(testnetKey.toBase58().startsWith('tprv'));
    const signature = createMessageSignature(request, testnetKey.toBase58(), utxolib.networks.testnet);
    assert(verifyMessageSignature(request, signature, testnetKey.neutered().toBase58(), utxolib.networks.testnet));
  });

  it('rejects a tpub when verified with the bitcoin network', function () {
    const signature = createMessageSignature(request, testnetKey.toBase58(), utxolib.networks.testnet);
    assert.throws(() => verifyMessageSignature(request, signature, testnetKey.neutered().toBase58()));
  });
});
