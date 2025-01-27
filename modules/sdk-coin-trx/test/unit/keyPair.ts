import assert from 'assert';

import { KeyPair } from '../../src';
import { AddressFormat } from '@bitgo/sdk-core';
import { describe, it } from 'node:test';

describe('Trx KeyPair', function () {
  const defaultSeed = { seed: Buffer.alloc(32) };

  describe('should create a KeyPair', function () {
    it('from an xpub', () => {
      const source = {
        pub: 'xpub661MyMwAqRbcFhCvdhTAfpEEDV58oqDvv65YNHC686NNs4KbH8YZQJWVmrfbve7aAVHzxw8bKFxA7MLeDK6BbLfkE3bqkvHLPgaGHHtYGeY',
      };
      const keyPair = new KeyPair(source);
      const defaultKeys = keyPair.getKeys();
      assert.strictEqual(defaultKeys.prv, undefined);
      assert.strictEqual(
        defaultKeys.pub,
        '04D63D9FD9FD772A989C5B90EDB37716406356E98273E5F98FE07652247A3A827503E948A2FDBF74A981D4E0054F10EDA7042C2D469F44473D3C7791E0E326E355'
      );

      const extendedKeys = keyPair.getExtendedKeys();
      assert.strictEqual(extendedKeys.xprv, undefined);
      assert.strictEqual(
        extendedKeys.xpub,
        'xpub661MyMwAqRbcFhCvdhTAfpEEDV58oqDvv65YNHC686NNs4KbH8YZQJWVmrfbve7aAVHzxw8bKFxA7MLeDK6BbLfkE3bqkvHLPgaGHHtYGeY'
      );
    });

    it('from an xprv', () => {
      const source = {
        prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };
      const keyPair = new KeyPair(source);
      const defaultKeys = keyPair.getKeys();
      assert.strictEqual(defaultKeys.prv!, '82A34E3867EA7EA4E67E27865D500AE84E98D07AB1BAB06526F0A5A5FDCC3EBA');
      assert.strictEqual(
        defaultKeys.pub,
        '04D63D9FD9FD772A989C5B90EDB37716406356E98273E5F98FE07652247A3A827503E948A2FDBF74A981D4E0054F10EDA7042C2D469F44473D3C7791E0E326E355'
      );

      const extendedKeys = keyPair.getExtendedKeys();
      assert.strictEqual(
        extendedKeys.xprv!,
        'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2'
      );
      assert.strictEqual(
        extendedKeys.xpub,
        'xpub661MyMwAqRbcFhCvdhTAfpEEDV58oqDvv65YNHC686NNs4KbH8YZQJWVmrfbve7aAVHzxw8bKFxA7MLeDK6BbLfkE3bqkvHLPgaGHHtYGeY'
      );
    });

    it('from an uncompressed public key', () => {
      const source = {
        pub: '04D63D9FD9FD772A989C5B90EDB37716406356E98273E5F98FE07652247A3A827503E948A2FDBF74A981D4E0054F10EDA7042C2D469F44473D3C7791E0E326E355',
      };
      const keyPair = new KeyPair(source);
      const defaultKeys = keyPair.getKeys();
      assert.strictEqual(defaultKeys.prv, undefined);
      assert.strictEqual(
        defaultKeys.pub,
        '04D63D9FD9FD772A989C5B90EDB37716406356E98273E5F98FE07652247A3A827503E948A2FDBF74A981D4E0054F10EDA7042C2D469F44473D3C7791E0E326E355'
      );

      assert.throws(() => keyPair.getExtendedKeys());
    });

    it('from a compressed public key', () => {
      const source = {
        pub: '03D63D9FD9FD772A989C5B90EDB37716406356E98273E5F98FE07652247A3A8275',
      };
      const keyPair = new KeyPair(source);
      const defaultKeys = keyPair.getKeys();
      assert.strictEqual(defaultKeys.prv, undefined);
      assert.strictEqual(
        defaultKeys.pub,
        '04D63D9FD9FD772A989C5B90EDB37716406356E98273E5F98FE07652247A3A827503E948A2FDBF74A981D4E0054F10EDA7042C2D469F44473D3C7791E0E326E355'
      );

      assert.throws(() => keyPair.getExtendedKeys());
    });

    it('from a raw private key', () => {
      const source = {
        prv: '82A34E3867EA7EA4E67E27865D500AE84E98D07AB1BAB06526F0A5A5FDCC3EBA',
      };
      const keyPair = new KeyPair(source);
      const defaultKeys = keyPair.getKeys();
      assert.strictEqual(defaultKeys.prv!, '82A34E3867EA7EA4E67E27865D500AE84E98D07AB1BAB06526F0A5A5FDCC3EBA');
      assert.strictEqual(
        defaultKeys.pub,
        '04D63D9FD9FD772A989C5B90EDB37716406356E98273E5F98FE07652247A3A827503E948A2FDBF74A981D4E0054F10EDA7042C2D469F44473D3C7791E0E326E355'
      );

      assert.throws(() => keyPair.getExtendedKeys());
    });
  });

  describe('should fail to create a KeyPair', function () {
    it('from an invalid seed', () => {
      const seed = { seed: Buffer.alloc(8) }; //  Seed should be at least 128 bits (16 bytes, not 8)
      assert.throws(() => new KeyPair(seed));
    });

    it('from an invalid public key', () => {
      const source = {
        pub: '01D63D',
      };
      assert.throws(() => new KeyPair(source));
    });

    it('from an invalid private key', () => {
      const source = {
        prv: '82A34E',
      };
      assert.throws(() => new KeyPair(source));
    });
  });

  describe('getAddress', function () {
    it('should get a new hex address', () => {
      const keyPair = new KeyPair(defaultSeed);
      const address = keyPair.getAddress(AddressFormat.hex);
      assert.strictEqual(address, '41EB317B9F2E0891D66C061DDC3F5EE7ED42D70A44');
    });

    it('should get a new base58 address', () => {
      const keyPair = new KeyPair(defaultSeed);
      const address = keyPair.getAddress(AddressFormat.base58);
      assert.strictEqual(address, 'TXQo5GgQQJYVzreX5yzqqVnzBQP5Ek2iQW');
    });

    it('should get a new base58 address by default', () => {
      const keyPair = new KeyPair(defaultSeed);
      const address = keyPair.getAddress();
      assert.strictEqual(address, 'TXQo5GgQQJYVzreX5yzqqVnzBQP5Ek2iQW');
    });
  });

  describe('getKeys', function () {
    it('should get private and public keys in the protocol default format', () => {
      const keyPair = new KeyPair(defaultSeed);
      const { prv, pub } = keyPair.getKeys();
      assert.strictEqual(prv!, '82A34E3867EA7EA4E67E27865D500AE84E98D07AB1BAB06526F0A5A5FDCC3EBA');
      assert.strictEqual(
        pub,
        '04D63D9FD9FD772A989C5B90EDB37716406356E98273E5F98FE07652247A3A827503E948A2FDBF74A981D4E0054F10EDA7042C2D469F44473D3C7791E0E326E355'
      );
    });

    it('should get private and public keys for a random seed', () => {
      const keyPair = new KeyPair();
      const { prv, pub } = keyPair.getKeys();
      assert.notStrictEqual(prv, undefined);
      assert.notStrictEqual(pub, undefined);
    });
  });

  describe('getExtendedKeys', function () {
    it('should get the keys in extended format', () => {
      const keyPair = new KeyPair(defaultSeed);
      const { xprv, xpub } = keyPair.getExtendedKeys();
      assert.strictEqual(
        xprv!,
        'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2'
      );
      assert.strictEqual(
        xpub,
        'xpub661MyMwAqRbcFhCvdhTAfpEEDV58oqDvv65YNHC686NNs4KbH8YZQJWVmrfbve7aAVHzxw8bKFxA7MLeDK6BbLfkE3bqkvHLPgaGHHtYGeY'
      );
    });

    it('should get the keys in extended format  for a random seed', () => {
      const keyPair = new KeyPair();
      const { xprv, xpub } = keyPair.getExtendedKeys();
      assert.notStrictEqual(xprv, undefined);
      assert.notStrictEqual(xpub, undefined);
    });
  });
  describe('signMessage', function () {
    it('should sign a message', () => {
      const keyPair = new KeyPair(defaultSeed);
      const message = 'Hello world';
      const signature = keyPair.signMessage(message);
      assert.strictEqual(
        signature.toString('hex'),
        '83eec642ee0215c5d645393fa3f23b586bfe426ec4206fdb2b66d1620d308a4d4df57cc10cc4207c4a4c19e2ed572229bb1afe26ca0018eaed2bd2a44528f67d1b'
      );
      assert.strictEqual(keyPair.verifySignature(message, signature), true);
    });

    it('should fail if there is no private key', () => {
      const source = {
        pub: '03D63D9FD9FD772A989C5B90EDB37716406356E98273E5F98FE07652247A3A8275',
      };
      const keyPair = new KeyPair(source);
      const message = 'Hello world';
      assert.throws(() => keyPair.signMessage(message));
    });
  });

  describe('verifySignature', function () {
    it('should be true for a properly signed message', () => {
      const keyPair = new KeyPair(defaultSeed);
      const message = 'Hello world';
      const signature = Buffer.from(
        '83eec642ee0215c5d645393fa3f23b586bfe426ec4206fdb2b66d1620d308a4d4df57cc10cc4207c4a4c19e2ed572229bb1afe26ca0018eaed2bd2a44528f67d1b',
        'hex'
      );
      assert.strictEqual(keyPair.verifySignature(message, signature), true);
    });

    it('should be false for a message with the wrong signature', () => {
      const keyPair = new KeyPair(defaultSeed);
      const message = 'Not the message you expected';
      const signature = Buffer.from(
        '83eec642ee0215c5d645393fa3f23b586bfe426ec4206fdb2b66d1620d308a4d4df57cc10cc4207c4a4c19e2ed572229bb1afe26ca0018eaed2bd2a44528f67d1b',
        'hex'
      );
      assert.strictEqual(keyPair.verifySignature(message, signature), false);
    });
  });
});
