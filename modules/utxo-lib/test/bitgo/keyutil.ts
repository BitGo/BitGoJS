import { networks } from '../../src';

const assert = require('assert');
const crypto = require('crypto');

import { ECPairInterface } from 'ecpair';
import {
  convertExtendedKeyNetwork,
  privateKeyBufferFromECPair,
  privateKeyBufferToECPair,
} from '../../src/bitgo/keyutil';
import { bip32, ECPair } from '../../src/noble_ecc';

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

describe('convertExtendedKeyNetwork', function () {
  const prvKeyBuffer = crypto.randomBytes(32);
  const mainnetHdNode = bip32.fromSeed(prvKeyBuffer, networks.bitcoin);
  const testnetHdNode = bip32.fromSeed(prvKeyBuffer, networks.testnet);

  it('should return the same extended key if fromNetwork and targetNetwork are the same', () => {
    const extendedKey = mainnetHdNode.toBase58();
    const result = convertExtendedKeyNetwork(extendedKey, networks.bitcoin, networks.bitcoin);
    assert.strictEqual(result, extendedKey);
  });

  it('should change the network from mainnet to testnet for a neutered (public) key', () => {
    const extendedKey = mainnetHdNode.neutered().toBase58();
    const expectedKey = convertExtendedKeyNetwork(extendedKey, networks.bitcoin, networks.testnet);
    const testnetHdNodeFromExpected = bip32.fromBase58(expectedKey, networks.testnet);
    assert.deepStrictEqual(testnetHdNodeFromExpected.publicKey, mainnetHdNode.neutered().publicKey);
  });

  it('should change the network from testnet to mainnet for a neutered (public) key', () => {
    const extendedKey = testnetHdNode.neutered().toBase58();
    const expectedKey = convertExtendedKeyNetwork(extendedKey, networks.testnet, networks.bitcoin);
    const mainnetHdNodeFromExpected = bip32.fromBase58(expectedKey, networks.bitcoin);
    assert.deepStrictEqual(mainnetHdNodeFromExpected.publicKey, testnetHdNode.neutered().publicKey);
  });

  it('should change the network from mainnet to testnet for a non-neutered (private) key', () => {
    const extendedKey = mainnetHdNode.toBase58();
    const expectedKey = convertExtendedKeyNetwork(extendedKey, networks.bitcoin, networks.testnet);
    const testnetHdNodeFromExpected = bip32.fromBase58(expectedKey, networks.testnet);
    assert.deepStrictEqual(testnetHdNodeFromExpected.privateKey, mainnetHdNode.privateKey);
  });

  it('should change the network from testnet to mainnet for a non-neutered (private) key', () => {
    const extendedKey = testnetHdNode.toBase58();
    const expectedKey = convertExtendedKeyNetwork(extendedKey, networks.testnet, networks.bitcoin);
    const mainnetHdNodeFromExpected = bip32.fromBase58(expectedKey, networks.bitcoin);
    assert.deepStrictEqual(mainnetHdNodeFromExpected.privateKey, testnetHdNode.privateKey);
  });
});
