import utils from '../../src/lib/utils';
import { Accounts } from '../resources/starknet';
import 'should';

describe('Starknet Utils', () => {
  describe('isValidAddress', () => {
    it('should accept a valid Starknet address', () => {
      utils.isValidAddress(Accounts.account1.address).should.equal(true);
    });

    it('should accept a second valid address', () => {
      utils.isValidAddress(Accounts.account2.address).should.equal(true);
    });

    it('should reject an invalid address', () => {
      utils.isValidAddress('not_an_address').should.equal(false);
    });

    it('should reject an empty string', () => {
      utils.isValidAddress('').should.equal(false);
    });

    it('should reject address without 0x prefix', () => {
      utils.isValidAddress('04a1f29b8b8e3d3c9f6c9b7a8d2e1f0c5b4a3d2e1f0c5b4a3d2e1f0c5b4a3d2e').should.equal(false);
    });
  });

  describe('isValidPublicKey', () => {
    it('should accept a valid uncompressed public key', () => {
      utils.isValidPublicKey(Accounts.account1.publicKey).should.equal(true);
    });

    it('should reject an invalid public key', () => {
      utils.isValidPublicKey('not_a_key').should.equal(false);
    });

    it('should reject an empty string', () => {
      utils.isValidPublicKey('').should.equal(false);
    });
  });

  describe('isValidPrivateKey', () => {
    it('should accept a valid private key', () => {
      utils.isValidPrivateKey(Accounts.account1.secretKey).should.equal(true);
    });

    it('should reject an invalid private key', () => {
      utils.isValidPrivateKey('not_a_key').should.equal(false);
    });

    it('should reject an empty string', () => {
      utils.isValidPrivateKey('').should.equal(false);
    });
  });

  describe('getUncompressedPublicKey', () => {
    it('should return 128 hex chars from uncompressed key', () => {
      const result = utils.getUncompressedPublicKey(Accounts.account1.publicKey);
      result.length.should.equal(128);
    });
  });

  describe('formatEthAccountSignature', () => {
    it('should format signature as 5 felt252 values', () => {
      const r = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const s = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = utils.formatEthAccountSignature(r, s, 0);
      result.length.should.equal(5);
      result.forEach((val) => val.should.startWith('0x'));
    });

    it('should handle recid 0 and 1', () => {
      const r = 'aaaa';
      const s = 'bbbb';
      const sig0 = utils.formatEthAccountSignature(r, s, 0);
      const sig1 = utils.formatEthAccountSignature(r, s, 1);
      sig0[4].should.equal('0x0');
      sig1[4].should.equal('0x1');
    });
  });
});
