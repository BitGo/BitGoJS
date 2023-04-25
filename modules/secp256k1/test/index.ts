import * as assert from 'assert';

import * as secp256k1 from '../src';

describe('secp256k1', function () {
  describe('bip32', function () {
    // https://github.com/bitcoinjs/bip32/blob/master/test/fixtures/index.json
    const fixture = {
      seed: '000102030405060708090a0b0c0d0e0f',
      wif: 'L52XzL2cMkHxqxBXRyEpnPQZGUs3uKiL3R11XbAdHigRzDozKZeW',
      pubKey: '0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2',
      privKey: 'e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35',
      chainCode: '873dff81c02f525623fd1fe5167eac3a55a049de3d314bb42ee227ffed37d508',
      base58:
        'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      base58Priv:
        'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi',
      identifier: '3442193e1bb70916e914552172cd4e2dbc9df811',
      fingerprint: '3442193e',
    };
    it('has expected value', function () {
      const key = secp256k1.bip32.fromSeed(Buffer.from(fixture.seed, 'hex'));
      assert.strictEqual(key.toWIF(), fixture.wif);
      assert.strictEqual(key.publicKey.toString('hex'), fixture.pubKey);
      assert.strictEqual(key.privateKey?.toString('hex'), fixture.privKey);
      assert.strictEqual(key.chainCode.toString('hex'), fixture.chainCode);
      assert.strictEqual(key.neutered().toBase58(), fixture.base58);
      assert.strictEqual(key.toBase58(), fixture.base58Priv);
      assert.strictEqual(key.identifier.toString('hex'), fixture.identifier);
      assert.strictEqual(key.fingerprint.toString('hex'), fixture.fingerprint);
    });
  });

  describe('ecpair', function () {
    // https://github.com/bitcoinjs/ecpair/blob/master/test/ecpair.spec.ts
    it('has expected value', function () {
      const ONE = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');
      const keyPair = secp256k1.ECPair.fromPrivateKey(ONE);
      assert.strictEqual(
        keyPair.publicKey.toString('hex'),
        '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'
      );
    });
  });
});
