import * as should from 'should';
import * as EosResources from '../../../resources/eos';
import { Eos } from '../../../../src';

describe('Eos KeyPair', function () {
  const defaultSeed = { seed: Buffer.alloc(32, 'a') };
  describe('should create a valid KeyPair', () => {
    it('from an empty value', () => {
      const keyPair = new Eos.KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv!.length, 52);
      should.equal(keyPair.getKeys().pub.length, 53);
    });
  });

  describe('should create a valid KeyPair', () => {
    it('from a seed', () => {
      const keyPair = new Eos.KeyPair(defaultSeed);
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv!.length, 52);
      should.equal(keyPair.getKeys().pub.length, 53);
    });
  });

  describe('should create a valid KeyPair', () => {
    it('from a private key', () => {
      const keyPair = new Eos.KeyPair({ prv: EosResources.keypairAccounts.account1.secretKey });
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv!.length, 52);
      should.equal(keyPair.getKeys().pub.length, 53);
    });
  });

  describe('should create a valid KeyPair', () => {
    it('from a private key', () => {
      const keyPair = new Eos.KeyPair({ pub: EosResources.keypairAccounts.account1.pubKey });
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().pub.length, 53);
    });
  });
});
