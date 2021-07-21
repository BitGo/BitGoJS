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
    it('from a seed', () => {
      const keyPair = new Eos.KeyPair(defaultSeed);
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv!.length, 52);
      should.equal(keyPair.getKeys().pub.length, 53);
    });
    it('from a private key', () => {
      const keyPair = new Eos.KeyPair({ prv: EosResources.keypairAccounts.account1.secretKey });
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv!.length, 52);
      should.equal(keyPair.getKeys().pub.length, 53);
    });
    it('from a public key', () => {
      const keyPair = new Eos.KeyPair({ pub: EosResources.keypairAccounts.account1.pubKey });
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().pub.length, 53);
    });
    it('from a extended private key', () => {
      const keyPair = new Eos.KeyPair({ prv: EosResources.keypairAccounts.account3.secretKey });
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv!.length, 52);
      should.equal(keyPair.getKeys().pub.length, 53);
    });
    it('from a extended public key', () => {
      const keyPair = new Eos.KeyPair({ pub: EosResources.keypairAccounts.account3.pubKey });
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().pub.length, 53);
    });
  });

  describe('should not create a valid keyPair', async () => {
    it('From an invalid private key', async () => {
      should.throws(
        () => new Eos.KeyPair({ prv: 'gtysh' }),
        'Unsupported private key',
      );  
    });
    it('From an invalid public key', async () => {
      should.throws(
        () => new Eos.KeyPair({ pub: 'gtysh' }),
        'Unsupported public key',
      );
    });
    it('From an invalid seed', () => {
      should.throws(
        () => new Eos.KeyPair( { seed: Buffer.alloc(88, 'ki') }),
        'Seed should be at most 512 bits',
      );
    });
    it('From an invalid seed', () => {
      should.throws(
        () => new Eos.KeyPair( { seed: Buffer.alloc(8, 'ki') }),
        'Seed should be at least 128 bits',
      );
    });
  });

  describe('Eos address', async () => {
    it('Should not get an address', async () => {
      should.throws(
        () => { const keyPair = new Eos.KeyPair();
              keyPair.getAddress()},
        'getAddress not implemented',
      );  
    });
  });
});
