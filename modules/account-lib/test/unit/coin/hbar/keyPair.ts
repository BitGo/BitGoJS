import should from 'should';
import * as nacl from 'tweetnacl';
import { KeyPair } from '../../../../src/coin/hbar';
import * as testData from '../../../resources/hbar/hbar';

const pub = testData.ACCOUNT_1.publicKey.slice(24);
const prv = testData.ACCOUNT_1.privateKey.slice(32);
export const ed25519PrivKeyPrefix = '302e020100300506032b657004220420';
export const ed25519PubKeyPrefix = '302a300506032b6570032100';
// TODO: Add tests sending prv with prefix, pub with prefix, prv + pub combined

describe('Hedera Key Pair', () => {
  describe('should create a valid KeyPair', () => {
    it('from a public key', () => {
      const keyPair = new KeyPair({ pub: pub });
      should.equal(Buffer.from(keyPair.getKeys().pub).toString('hex'), pub);
    });

    it('from a private key', () => {
      const keyPair = new KeyPair({ prv: prv });
      should.equal(Buffer.from(keyPair.getKeys().prv!).toString('hex'), prv);
      should.equal(Buffer.from(keyPair.getKeys().pub).toString('hex'), pub);
    });

    it('from seed', () => {
      const seed = nacl.randomBytes(32);
      const keyPair = new KeyPair({ seed: Buffer.from(seed) });
      keyPair.getKeys().should.have.property('pub');
      keyPair.getKeys().should.have.property('prv');
    });

    it('without source', () => {
      const keyPair = new KeyPair();
      keyPair.getKeys().should.have.property('pub');
      keyPair.getKeys().should.have.property('prv');
    });
  });

  describe('should fail to create a KeyPair', () => {
    it('from an invalid public key', () => {
      const source = { pub: '01D63D' };
      should.throws(
        () => new KeyPair(source),
        e => e.message === 'Failed to parse correct key',
      );
    });

    it('from an invalid private key', () => {
      const source = { prv: '82A34E' };
      should.throws(
        () => new KeyPair(source),
        e => e.message === 'Failed to parse correct key',
      );
    });
  });

  describe('should fail to get address ', () => {
    it('from a private key', () => {
      const keyPair = new KeyPair({ prv: prv });
      should.throws(
        () => keyPair.getAddress(),
        e => e.message === 'Address derivation is not supported in Hedera',
      );
    });

    it('from a public key', () => {
      const keyPair = new KeyPair({ pub: pub });
      should.throws(
        () => keyPair.getAddress(),
        e => e.message === 'Address derivation is not supported in Hedera',
      );
    });
  });
});
