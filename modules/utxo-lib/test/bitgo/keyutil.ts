const assert = require('assert');
const crypto = require('crypto');

import { ECPairInterface } from 'ecpair';
import { privateKeyBufferFromECPair, privateKeyBufferToECPair } from '../../src/bitgo/keyutil';
import { ECPair } from '../../src/noble_ecc';

describe('privateKeyBufferFromECPair', function () {
  it('pads short private keys', function () {
    const keyPair = ECPair.fromPrivateKey(
      Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex')
    );
    assert.strictEqual(privateKeyBufferFromECPair(keyPair).length, 32);
    assert.strictEqual(
      privateKeyBufferFromECPair(keyPair).toString('hex'),
      '0000000000000000000000000000000000000000000000000000000000000001'
    );
  });

  it('does not pad 32 bytes private keys', function () {
    const hexString = 'a000000000000000000000000000000000000000000000000000000000000000';
    const keyPair = ECPair.fromPrivateKey(Buffer.from(hexString, 'hex'));
    assert.strictEqual(privateKeyBufferFromECPair(keyPair).length, 32);
    assert.strictEqual(privateKeyBufferFromECPair(keyPair).toString('hex'), hexString);
  });

  it('throws if passed value is not ecpair', function () {
    assert.throws(function () {
      privateKeyBufferFromECPair({} as ECPairInterface);
    }, new RegExp('invalid argument ecpair'));
  });
});

describe('privateKeyBufferToECPair', function () {
  it('constructs an ECPair from a random private key buffer', function () {
    const prvKeyBuffer = crypto.randomBytes(32);
    const ecPair = privateKeyBufferToECPair(prvKeyBuffer);
    const ecPairPrvBuffer = privateKeyBufferFromECPair(ecPair);
    assert.strictEqual(Buffer.compare(ecPairPrvBuffer, prvKeyBuffer), 0);
  });

  it('throws if the private key buffer is not a buffer', function () {
    assert.throws(function () {
      privateKeyBufferToECPair('not a buffer' as any);
    }, new RegExp('invalid private key buffer'));
  });

  it('throws if the private key buffer is not 32 bytes', function () {
    assert.throws(function () {
      privateKeyBufferToECPair(Buffer.alloc(31, 0x00));
    }, new RegExp('invalid private key buffer'));

    assert.throws(function () {
      privateKeyBufferToECPair(Buffer.alloc(33, 0x00));
    }, new RegExp('invalid private key buffer'));
  });
});
