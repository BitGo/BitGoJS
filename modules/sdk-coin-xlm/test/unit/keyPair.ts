import * as should from 'should';
import * as stellar from 'stellar-sdk';
import { KeyPair } from '../../src';
import { randomBytes } from 'crypto';
import assert from 'assert';

describe('Stellar Key Pair', () => {
  describe('should create a valid keypair', () => {
    const sampleKeys = {
      pub: '37c6be1c677873e42a90f3d0ed3b0e4f3ba8591f285769d8c922f7024ae0c009',
      prv: 'c034ca796a145e79acfac9bc9d97e4d3aaa42bfbe648b46bb1f3da794d7765fb',
    };

    it('from empty value', () => {
      const keyPair = new KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);

      const kp = keyPair.getKeys();
      kp.pub.startsWith('G').should.equal(true);
      kp.prv?.startsWith('S').should.equal(true);
    });

    it('from a seed', () => {
      const seed = randomBytes(32);
      const keyPair = new KeyPair({ seed });

      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);

      keyPair.getKeys(true).prv!.should.equal(seed.toString('hex'));
      keyPair.getKeys().prv!.should.equal(stellar.StrKey.encodeEd25519SecretSeed(seed));
    });

    it('from a prv', () => {
      const keyPair = new KeyPair({ prv: sampleKeys.prv });

      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);

      keyPair.getKeys(true).pub.should.equal(sampleKeys.pub);
      keyPair.getKeys(true).prv!.should.equal(sampleKeys.prv);

      keyPair.getKeys().pub.should.equal(stellar.StrKey.encodeEd25519PublicKey(Buffer.from(sampleKeys.pub, 'hex')));
      keyPair.getKeys().prv!.should.equal(stellar.StrKey.encodeEd25519SecretSeed(Buffer.from(sampleKeys.prv, 'hex')));
    });

    it('from a pub', () => {
      const keyPair = new KeyPair({ pub: sampleKeys.pub });
      keyPair.getKeys(true).pub.should.equal(sampleKeys.pub);
      keyPair.getKeys().pub.should.equal(stellar.StrKey.encodeEd25519PublicKey(Buffer.from(sampleKeys.pub, 'hex')));
    });
  });

  describe('should fail to create keypair', () => {
    it('from an invalid public key', () => {
      const source = { pub: 'invalid123' };
      assert.throws(
        () => new KeyPair(source),
        (err: any) => err.message === 'Invalid public key: invalid123'
      );
    });

    it('from an invalid private key', () => {
      const source = { prv: 'invalid123' };
      assert.throws(
        () => new KeyPair(source),
        (err: any) => err.message === 'Invalid private key: invalid123'
      );
    });

    it('from an invalid seed', () => {
      const source = { seed: randomBytes(31) };
      should.throws(() => new KeyPair(source), 'bad seed size');
    });
  });
});
