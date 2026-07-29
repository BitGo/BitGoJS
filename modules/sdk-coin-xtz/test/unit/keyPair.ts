import assert from 'assert';
import should from 'should';

import { XtzLib } from '../../src';

describe('Xtz KeyPair', function () {
  const defaultSeed = { seed: Buffer.alloc(32) };

  describe('should create a KeyPair', function () {
    it('from an xpub', () => {
      const source = {
        pub: 'xpub661MyMwAqRbcFhCvdhTAfpEEDV58oqDvv65YNHC686NNs4KbH8YZQJWVmrfbve7aAVHzxw8bKFxA7MLeDK6BbLfkE3bqkvHLPgaGHHtYGeY',
      };
      const keyPair = new XtzLib.KeyPair(source);
      const defaultKeys = keyPair.getKeys();
      should.not.exist(defaultKeys.prv);
      defaultKeys.pub.should.equal('sppk7csjXKT4wvUNCPMfAgZMNuvSjzW4Y2ZAKZEdvyEPtYagE6pCwkw');

      const extendedKeys = keyPair.getExtendedKeys();
      should.not.exist(extendedKeys.xprv);
      extendedKeys.xpub.should.equal(
        'xpub661MyMwAqRbcFhCvdhTAfpEEDV58oqDvv65YNHC686NNs4KbH8YZQJWVmrfbve7aAVHzxw8bKFxA7MLeDK6BbLfkE3bqkvHLPgaGHHtYGeY'
      );
    });

    it('from an xprv', () => {
      const source = {
        prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };
      const keyPair = new XtzLib.KeyPair(source);
      const defaultKeys = keyPair.getKeys();
      defaultKeys.prv!.should.equal('spsk2R6ek35CtfJMt2XHPWgFcf1wUGLK2fKbU3f4hWZNABo1YrrqP7');
      defaultKeys.pub.should.equal('sppk7csjXKT4wvUNCPMfAgZMNuvSjzW4Y2ZAKZEdvyEPtYagE6pCwkw');

      const extendedKeys = keyPair.getExtendedKeys();
      extendedKeys.xprv!.should.equal(
        'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2'
      );
      extendedKeys.xpub.should.equal(
        'xpub661MyMwAqRbcFhCvdhTAfpEEDV58oqDvv65YNHC686NNs4KbH8YZQJWVmrfbve7aAVHzxw8bKFxA7MLeDK6BbLfkE3bqkvHLPgaGHHtYGeY'
      );
    });

    it('from an uncompressed public key', () => {
      const source = {
        pub: '04D63D9FD9FD772A989C5B90EDB37716406356E98273E5F98FE07652247A3A827503E948A2FDBF74A981D4E0054F10EDA7042C2D469F44473D3C7791E0E326E355',
      };
      const keyPair = new XtzLib.KeyPair(source);
      const defaultKeys = keyPair.getKeys();
      should.not.exist(defaultKeys.prv);
      defaultKeys.pub.should.equal('sppk7csjXKT4wvUNCPMfAgZMNuvSjzW4Y2ZAKZEdvyEPtYagE6pCwkw');

      assert.throws(() => keyPair.getExtendedKeys());
    });

    it('from a compressed public key', () => {
      const source = {
        pub: '03D63D9FD9FD772A989C5B90EDB37716406356E98273E5F98FE07652247A3A8275',
      };
      const keyPair = new XtzLib.KeyPair(source);
      const defaultKeys = keyPair.getKeys();
      should.not.exist(defaultKeys.prv);
      defaultKeys.pub.should.equal('sppk7csjXKT4wvUNCPMfAgZMNuvSjzW4Y2ZAKZEdvyEPtYagE6pCwkw');

      assert.throws(() => keyPair.getExtendedKeys());
    });

    it('from a Tezos public key', () => {
      const source = {
        pub: 'sppk7csjXKT4wvUNCPMfAgZMNuvSjzW4Y2ZAKZEdvyEPtYagE6pCwkw',
      };
      const keyPair = new XtzLib.KeyPair(source);
      const defaultKeys = keyPair.getKeys();
      should.not.exist(defaultKeys.prv);
      defaultKeys.pub.should.equal('sppk7csjXKT4wvUNCPMfAgZMNuvSjzW4Y2ZAKZEdvyEPtYagE6pCwkw');

      assert.throws(() => keyPair.getExtendedKeys());
    });

    it('from a raw private key', () => {
      const source = {
        prv: '82A34E3867EA7EA4E67E27865D500AE84E98D07AB1BAB06526F0A5A5FDCC3EBA',
      };
      const keyPair = new XtzLib.KeyPair(source);
      const defaultKeys = keyPair.getKeys();
      defaultKeys.prv!.should.equal('spsk2R6ek35CtfJMt2XHPWgFcf1wUGLK2fKbU3f4hWZNABo1YrrqP7');
      defaultKeys.pub.should.equal('sppk7csjXKT4wvUNCPMfAgZMNuvSjzW4Y2ZAKZEdvyEPtYagE6pCwkw');

      assert.throws(() => keyPair.getExtendedKeys());
    });

    it('from a Tezos private key', () => {
      const source = {
        prv: 'spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL',
      };
      const keyPair = new XtzLib.KeyPair(source);
      const defaultKeys = keyPair.getKeys();
      defaultKeys.prv!.should.equal('spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL');
      defaultKeys.pub.should.equal('sppk7ZWB8diU2TWehxdkWCV2DTFvn1hPz4qLjiD3nJQozKnoSEnSC8b');
      keyPair.getAddress().should.equal('tz2P2E8EgHaLA6A17rH3pE9T2tx6DA7D4siW');

      assert.throws(() => keyPair.getExtendedKeys());
    });
  });

  describe('should fail to create a KeyPair', function () {
    it('from an invalid seed', () => {
      const seed = { seed: Buffer.alloc(8) }; //  Seed should be at least 128 bits (16 bytes, not 8)
      assert.throws(() => new XtzLib.KeyPair(seed));
    });

    it('from an invalid public key', () => {
      const source = {
        pub: '01D63D',
      };
      assert.throws(() => new XtzLib.KeyPair(source));
    });

    it('from an invalid private key', () => {
      const source = {
        prv: '82A34E',
      };
      assert.throws(() => new XtzLib.KeyPair(source));
    });
  });

  describe('getAddress', function () {
    it('should get an address', () => {
      const keyPair = new XtzLib.KeyPair(defaultSeed);
      const address = keyPair.getAddress();
      address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
    });
  });

  describe('getKeys', function () {
    it('should get private and public keys in the protocol default format', () => {
      const keyPair = new XtzLib.KeyPair(defaultSeed);
      const { prv, pub } = keyPair.getKeys();
      prv!.should.equal('spsk2R6ek35CtfJMt2XHPWgFcf1wUGLK2fKbU3f4hWZNABo1YrrqP7');
      pub.should.equal('sppk7csjXKT4wvUNCPMfAgZMNuvSjzW4Y2ZAKZEdvyEPtYagE6pCwkw');
    });

    it('should get private and public keys for a random seed', () => {
      const keyPair = new XtzLib.KeyPair();
      const { prv, pub } = keyPair.getKeys();
      should.exist(prv);
      should.exist(pub);
    });
  });

  describe('getExtendedKeys', function () {
    it('should get the keys in extended format', () => {
      const keyPair = new XtzLib.KeyPair(defaultSeed);
      const { xprv, xpub } = keyPair.getExtendedKeys();
      xprv!.should.equal(
        'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2'
      );
      xpub.should.equal(
        'xpub661MyMwAqRbcFhCvdhTAfpEEDV58oqDvv65YNHC686NNs4KbH8YZQJWVmrfbve7aAVHzxw8bKFxA7MLeDK6BbLfkE3bqkvHLPgaGHHtYGeY'
      );
    });

    it('should get the keys in extended format  for a random seed', () => {
      const keyPair = new XtzLib.KeyPair();
      const { xprv, xpub } = keyPair.getExtendedKeys();
      should.exist(xprv);
      should.exist(xpub);
    });
  });
});
