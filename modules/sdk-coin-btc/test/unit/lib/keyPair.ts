import assert from 'assert';
import should from 'should';
import { KeyPair } from '../../../src';
import { AddressFormat } from '../../../src/lib/keyPair';

const fixtures = require('../fixture/keys.json');

describe('BTC Key Pair', () => {
  describe('should create a valid KeyPair', () => {
    fixtures.valid
      .filter((f) => f.network === 'bitcoin')
      .forEach((f) => {
        it('from mainnet public key ' + f.Q, () => {
          const kp = new KeyPair({ pub: f.Q });
          const address = kp.getAddress(AddressFormat.mainnet);
          should.equal(address, f.address);
        });
      });

    fixtures.valid
      .filter((f) => f.network === 'testnet')
      .forEach((f) => {
        it('from testnet public key ' + f.Q, () => {
          const kp = new KeyPair({ pub: f.Q });
          const address = kp.getAddress(AddressFormat.testnet);
          should.equal(address, f.address);
        });
      });

    fixtures.valid
      .filter((f) => f.network === 'bitcoin')
      .filter((f) => f.compressed) // Address will be generated using the compressed version of the pub key
      .forEach((f) => {
        it('from mainnet private key ' + f.d, () => {
          const kp = new KeyPair({ prv: f.d });
          const address = kp.getAddress(AddressFormat.mainnet);
          should.equal(address, f.address);
        });
      });

    fixtures.valid
      .filter((f) => f.network === 'testnet')
      .filter((f) => f.compressed) // Address will be generated using the compressed version of the pub key
      .forEach((f) => {
        it('from testnet private key ' + f.d, () => {
          const kp = new KeyPair({ prv: f.d });
          const address = kp.getAddress(AddressFormat.testnet);
          should.equal(address, f.address);
        });
      });

    it('from an empty value', () => {
      const kp = new KeyPair();

      const address = kp.getAddress();
      should.exists(address);

      const keys = kp.getKeys();
      should.exists(keys.prv);
      should.exists(keys.pub);
      should.equal(keys.prv!.length, 64);
      should.equal(keys.pub.length, 66);

      const extendedKeys = kp.getExtendedKeys();
      should.exists(extendedKeys.xprv);
      should.exists(extendedKeys.xpub);
    });

    it('from an existing uncompressed pub', () => {
      const kp = new KeyPair({
        pub: '04c2ebca315e72045af26ab178fd2a943f5b6ed72f55d5c648e6c125d785bba546f131b3c74fa79a078c0ecfb00e006b67c59a91e17874409606f519462464d2a0',
      });

      const address = kp.getAddress(AddressFormat.testnetBech32);
      should.exists(address);
      should.equal(address, 'tb1qlsugvel9v83ugxrc9vqlhpphnhsqzmxhavtcvx');

      const keys = kp.getKeys();
      should.not.exists(keys.prv);
      should.exists(keys.pub);
      should.equal(keys.pub.length, 66);
    });

    it('from an existing compressed pub', () => {
      const kp = new KeyPair({
        pub: '02c2ebca315e72045af26ab178fd2a943f5b6ed72f55d5c648e6c125d785bba546',
      });

      const address = kp.getAddress(AddressFormat.testnetBech32);
      should.exists(address);
      should.equal(address, 'tb1qk48g5mtmqad6tehuf5cyfwgmsfmklqv4fwd6rf');

      const keys = kp.getKeys();
      should.not.exists(keys.prv);
      should.exists(keys.pub);
      should.equal(keys.pub.length, 66);
    });
  });
  describe('should throw', () => {
    fixtures.invalid.fromPrivateKey.forEach((f) => {
      it('for an invalid private key when ' + f.exception, () => {
        assert.throws(() => {
          new KeyPair({ prv: f.d });
        });
      });
    });

    fixtures.invalid.fromPublicKey.forEach((f) => {
      it('for an invalid public key when ' + f.exception, () => {
        assert.throws(() => {
          new KeyPair({ pub: f.Q });
        });
      });
    });
  });
});
