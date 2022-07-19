/**
 * @prettier
 */
import assert from 'assert';
import { register } from '../../../src/keyPair';
import * as coinModules from '../../../src';
import { coins } from '@bitgo/statics';
import { KeyPair as EthKeyPair } from '@bitgo/sdk-coin-eth';
import { KeyPair as Eth2KeyPair } from '@bitgo/sdk-coin-eth2';
import { Ed25519KeyPair } from '@bitgo/sdk-core';

describe('Key Pair Factory', () => {
  describe('coinToKey map initialization', function () {
    const supportedCoinsExceptTestnet = Object.keys(coinModules)
      // TODO(BG-40990): temporarily disable eth2 from the test for bls not initialized error
      .filter((k) => coinModules[k].KeyPair && k.trim().toLowerCase() !== 'eth2');

    supportedCoinsExceptTestnet.forEach((coinName) => {
      it(`should initialize a ${coinName} keyPair map`, () => {
        const keyPair = register(coinName);
        (typeof keyPair.getKeys).should.equal('function');
        (typeof keyPair.getAddress).should.equal('function');
        (typeof keyPair.recordKeysFromPrivateKey).should.equal('function');
        (typeof keyPair.recordKeysFromPublicKey).should.equal('function');
      });
    });

    it('should fail to instantiate an unsupported coin', () => {
      assert.throws(() => register('fakeUnsupported'));
    });
  });

  describe('secp256k1 generation', function () {
    it('should initialize eth keyPair map', () => {
      const eth = coins.get('eth');
      const keyPair = register(eth.name) as EthKeyPair;
      (typeof keyPair.getKeys).should.equal('function');
      (typeof keyPair.getAddress).should.equal('function');
      (typeof keyPair.getPublicKey).should.equal('function');
    });

    it('should initialize eth keyPair map with arguments', () => {
      const eth = coins.get('eth');
      const uncompressedPub =
        '04D63D9FD9FD772A989C5B90EDB37716406356E98273E5F98FE07652247A3A827503E948A2FDBF74A981D4E0054F10EDA7042C2D469F44473D3C7791E0E326E355';
      const pubKey = { pub: uncompressedPub };
      const keyPair = register(eth.name, pubKey) as EthKeyPair;
      (typeof keyPair.getKeys).should.equal('function');
      (typeof keyPair.getAddress).should.equal('function');
      (typeof keyPair.getPublicKey).should.equal('function');
    });
  });

  // TODO(BG-40990): temporarily disable eth2 from the test for bls not initialized error
  describe('blsKey generation', function () {
    xit('should initialize eth2 keyPair map', () => {
      const eth = coins.get('eth2');
      const keyPair = register(eth.name) as Eth2KeyPair;
      (typeof keyPair.getKeys).should.equal('function');
      (typeof keyPair.getAddress).should.equal('function');
      (typeof keyPair.sign).should.equal('function');
    });
  });

  describe('ed25519 generation', function () {
    const fixedKeyPair = {
      prv: 'e349d47cd4af4644afbc05b8463c0d0d19a0cc742be5c1646af2e7be8aafbd50',
    };
    const givenSignature = new Uint8Array(
      Buffer.from(
        'b2e775827f6b3c9050524a7d2f5344db73eb92044d8e42c38357a30686a9ce3a19b8fbf8c9d1edb0f3c5232441d34b63af92805aed77097ee50076f696eaff0f',
        'hex',
      ),
    );

    ['dot', 'tdot', 'algo', 'talgo', 'hbar', 'thbar', 'sol', 'tsol'].forEach((coinName) => {
      describe(`${coinName} keyPair`, function () {
        const kp = register(coinName, fixedKeyPair) as Ed25519KeyPair;

        it(`should initialize ${coinName} keyPair map`, () => {
          const keyPair = register(coinName) as Ed25519KeyPair;
          (typeof keyPair.getKeys).should.equal('function');
          (typeof keyPair.getAddress).should.equal('function');
          (typeof keyPair.verifySignature).should.equal('function');
          (typeof keyPair.signMessage).should.equal('function');
        });

        it(`should initialize ${coinName} keyPair map with arguments`, () => {
          const keyPair = register(coinName, fixedKeyPair) as Ed25519KeyPair;
          (typeof keyPair.getKeys).should.equal('function');
          (typeof keyPair.getAddress).should.equal('function');
          (typeof keyPair.verifySignature).should.equal('function');
          (typeof keyPair.signMessage).should.equal('function');
        });

        it('should get same signature from same message', () => {
          // When
          const signature = kp.signMessage('message');
          // Then
          signature.should.deepEqual(givenSignature);
        });

        it('should get different signature form different message', () => {
          // When
          const signature = kp.signMessage('wrong message');
          // Then
          signature.should.not.deepEqual(givenSignature);
        });

        it('should be verified correctly', () => {
          // When
          const verifyResult = kp.verifySignature('message', givenSignature);
          // Then
          verifyResult.should.be.True();
        });

        it('should not be verified wrong message', () => {
          // When
          const verifyResult = kp.verifySignature('wrong message', givenSignature);
          // Then
          verifyResult.should.be.False();
        });
      });
    });
  });
});
