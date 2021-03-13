import * as should from 'should';

import { Eos } from '../../../../src';

describe('EOS KeyPair', function() {
  // these are all encodings of the same key so the test suite will show that they we can interchange between them
  const xprv =
    'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2';
  const xpub =
    'xpub661MyMwAqRbcFhCvdhTAfpEEDV58oqDvv65YNHC686NNs4KbH8YZQJWVmrfbve7aAVHzxw8bKFxA7MLeDK6BbLfkE3bqkvHLPgaGHHtYGeY';
  const prv = '5JopYwz59asDsQ6vaxj78oBnTqq2zQiKLR8UGfzChbyWEVeCE3P';
  const pub = 'EOS8Tb2DJ3QmHqLrG4gE4Te7b3RXkXBzvJ8jBx9AJ8tSt6c3dJqYv';
  const uncompressedPub = '04D63D9FD9FD772A989C5B90EDB37716406356E98273E5F98FE07652247A3A827503E948A2FDBF74A981D4E0054F10EDA7042C2D469F44473D3C7791E0E326E355';
  const address = '';

  describe('should create a KeyPair', function() {
    it('from an xpub', () => {
      const keyPair = new Eos.KeyPair({ pub: xpub });
      const defaultKeys = keyPair.getKeys();
      should.not.exist(defaultKeys.prv);

      const extendedKeys = keyPair.getExtendedKeys();
      should.not.exist(extendedKeys.xprv);
      extendedKeys.xpub.should.equal(xpub);
    });

    it('from an xprv', () => {
      const keyPair = new Eos.KeyPair({ prv: xprv });
      const defaultKeys = keyPair.getKeys();
      defaultKeys.prv!.should.equal(prv);
      defaultKeys.pub.should.equal(pub);

      const extendedKeys = keyPair.getExtendedKeys();
      extendedKeys.xprv!.should.equal(xprv);
      extendedKeys.xpub.should.equal(xpub);
    });

    xit('from an uncompressed public key', () => {
      const keyPair = new Eos.KeyPair({ pub: uncompressedPub });
      const defaultKeys = keyPair.getKeys();
      should.not.exist(defaultKeys.prv);
      defaultKeys.pub.should.equal(uncompressedPub);
      should.throws(() => keyPair.getExtendedKeys());
    });

    xit('from a compressed public key', () => {
      const keyPair = new Eos.KeyPair({ pub });
      const defaultKeys = keyPair.getKeys();
      should.not.exist(defaultKeys.prv);
      defaultKeys.pub.should.equal(uncompressedPub);
      should.throws(() => keyPair.getExtendedKeys());
    });

    xit('from a raw private key', () => {
      const keyPair = new Eos.KeyPair({ prv });
      const defaultKeys = keyPair.getKeys();
      defaultKeys.prv!.should.equal(prv);
      defaultKeys.pub.should.equal(uncompressedPub);

      should.throws(() => keyPair.getExtendedKeys());
    });
  });

  describe('should fail to create a KeyPair', function() {
    it('from an invalid public key', () => {
      const source = {
        pub: '01D63D',
      };
      should.throws(() => new Eos.KeyPair(source));
    });

    it('from an invalid private key', () => {
      const source = {
        prv: '82A34E',
      };
      should.throws(() => new Eos.KeyPair(source));
    });
  });

  xdescribe('getAddress', function() {
    it('should get an address from xprv', () => {
      const keyPair = new Eos.KeyPair({ prv: xprv });
      const calculatedAddress = keyPair.getAddress();
      calculatedAddress.should.equal(address);
    });

    it('should get an address from xpub', () => {
      const keyPair = new Eos.KeyPair({ pub: xpub });
      const calculatedAddress = keyPair.getAddress();
      calculatedAddress.should.equal(address);
    });

    it('should get an address from prv', () => {
      const keyPair = new Eos.KeyPair({ prv });
      const calculatedAddress = keyPair.getAddress();
      calculatedAddress.should.equal(address);
    });

    it('should get an address from pub', () => {
      const keyPair = new Eos.KeyPair({ pub });
      const calculatedAddress = keyPair.getAddress();
      calculatedAddress.should.equal(address);
    });

    it('should get an address from uncompressed pub', () => {
      const keyPair = new Eos.KeyPair({ pub: uncompressedPub });
      const calculatedAddress = keyPair.getAddress();
      calculatedAddress.should.equal(address);
    });
  });

  describe('getExtendedKeys', function() {
    it('should get the keys in extended format from xprv', () => {
      const keyPair = new Eos.KeyPair({ prv: xprv });
      const { xprv: calculatedXprv, xpub: calculatedXpub } = keyPair.getExtendedKeys();
      calculatedXprv!.should.equal(xprv);
      calculatedXpub.should.equal(xpub);
    });

    it('should get the keys in extended format from xpub', () => {
      const keyPair = new Eos.KeyPair({ pub: xpub });
      const { xprv: calculatedXprv, xpub: calculatedXpub } = keyPair.getExtendedKeys();
      should.not.exist(calculatedXprv);
      calculatedXpub.should.equal(xpub);
    });

    xit('should not be able to get keys from prv', () => {
      const keyPair = new Eos.KeyPair({ prv });

      should.throws(() => keyPair.getExtendedKeys());
    });

    xit('should get the keys in extended format from pub', () => {
      const keyPair = new Eos.KeyPair({ pub });

      should.throws(() => keyPair.getExtendedKeys());
    });

    xit('should get the keys in extended format from uncompressed pub', () => {
      const keyPair = new Eos.KeyPair({ pub: uncompressedPub });

      should.throws(() => keyPair.getExtendedKeys());
    });
  });
});
