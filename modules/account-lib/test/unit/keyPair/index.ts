/**
 * @prettier
 */
import 'should';
import { register } from '../../../src/keyPair';
import * as coinModules from '../../../src';
import { coins } from '@bitgo/statics';
import { KeyPair as EthKeyPair } from '../../../src/coin/eth';
import { KeyPair as Eth2KeyPair } from '../../../src/coin/eth2';
import { KeyPair as DotKeyPair } from '../../../src/coin/dot';

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
    it('should initialize dot keyPair map', () => {
      const dot = coins.get('dot');
      const keyPair = register(dot.name) as DotKeyPair;
      (typeof keyPair.getKeys).should.equal('function');
      (typeof keyPair.getAddress).should.equal('function');
      (typeof keyPair.verifySignature).should.equal('function');
      (typeof keyPair.signMessage).should.equal('function');
    });

    it('should initialize dot keyPair map with arguments', () => {
      const dot = coins.get('dot');
      const dotPubKey = {
        pub: 'd472bd6e0f1f92297631938e30edb682208c2cd2698d80cf678c53a69979eb9f',
      };
      const keyPair = register(dot.name, dotPubKey) as DotKeyPair;
      (typeof keyPair.getKeys).should.equal('function');
      (typeof keyPair.getAddress).should.equal('function');
      (typeof keyPair.verifySignature).should.equal('function');
      (typeof keyPair.signMessage).should.equal('function');
    });
  });
});
