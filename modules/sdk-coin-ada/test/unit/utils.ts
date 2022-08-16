import should from 'should';
import { Utils } from '../../src';
import { toHex } from '@bitgo/sdk-core';
import { Ed25519Signature } from '@emurgo/cardano-serialization-lib-nodejs';
import { address, blockHash, signatures, txIds, privateKeys, publicKeys } from '../resources';

describe('utils', () => {
  it('should validate addresses correctly', () => {
    should.equal(Utils.default.isValidAddress(address.address1), true);
    should.equal(Utils.default.isValidAddress(address.address2), true);
    should.equal(Utils.default.isValidAddress(address.address3), false);
    should.equal(Utils.default.isValidAddress(address.address4), true);
    should.equal(Utils.default.isValidAddress('dfjk35y'), false);
    should.equal(Utils.default.isValidAddress(undefined as unknown as string), false);
    should.equal(Utils.default.isValidAddress(''), false);
  });

  it('should validate block hash correctly', () => {
    should.equal(Utils.default.isValidBlockId(blockHash.hash1), true);
    should.equal(Utils.default.isValidBlockId(blockHash.hash2), true);
    // param is coming as undefined so it was causing an issue
    should.equal(Utils.default.isValidBlockId(undefined as unknown as string), false);
    should.equal(Utils.default.isValidBlockId(''), false);
  });

  it('should validate invalid block hash correctly', () => {
    should.equal(Utils.default.isValidBlockId(''), false);
    should.equal(Utils.default.isValidBlockId('0xade35465gfvdcsxsz24300'), false);
    should.equal(Utils.default.isValidBlockId(blockHash.hash2 + 'ff'), false);
  });

  it('should validate public key correctly', () => {
    should.equal(
      Utils.default.isValidPublicKey('da025aa02990ef466069fadce5e3dcfad663914d6bf42fea3be50a8c3094d8e8'),
      true
    );
    should.equal(Utils.default.isValidPublicKey(publicKeys.pubKey1), true);
    should.equal(Utils.default.isValidPublicKey(publicKeys.pubKey2), true);
    should.equal(Utils.default.isValidPublicKey(publicKeys.pubKey3), true);
    should.equal(Utils.default.isValidPublicKey(publicKeys.pubKey4), false);
  });

  it('should validate private key correctly', () => {
    should.equal(Utils.default.isValidPrivateKey(privateKeys.prvKeyExtended), true);
    should.equal(Utils.default.isValidPrivateKey(privateKeys.prvKey2), true);
    should.equal(Utils.default.isValidPrivateKey(privateKeys.prvKey3WrongFormat), false);
    should.equal(Utils.default.isValidPrivateKey(privateKeys.prvKey4), true);
    should.equal(Utils.default.isValidPrivateKey(privateKeys.prvKey5WrongFormat), false);
  });

  it('should validate signature correctly', () => {
    should.equal(
      Utils.default.isValidSignature(toHex(Ed25519Signature.from_bech32(signatures.signature1).to_bytes())),
      true
    );
    should.equal(
      Utils.default.isValidSignature(toHex(Ed25519Signature.from_bech32(signatures.signature2).to_bytes())),
      true
    );
  });

  it('should validate invalid signature correctly', () => {
    should.equal(Utils.default.isValidSignature(''), false);
    should.equal(Utils.default.isValidSignature('0x00'), false);
    should.equal(Utils.default.isValidSignature(privateKeys.prvKeyExtended), false);
    should.equal(Utils.default.isValidSignature(signatures.signature1.slice(2)), false);
    should.equal(Utils.default.isValidSignature(signatures.signature2 + 'ff'), false);
  });

  it('should validate transaction id correctly', () => {
    should.equal(Utils.default.isValidTransactionId(txIds.hash1), true);
    should.equal(Utils.default.isValidTransactionId(txIds.hash2), true);
    should.equal(Utils.default.isValidTransactionId(txIds.hash3), true);
  });

  it('should validate invalid transaction id correctly', () => {
    should.equal(Utils.default.isValidTransactionId(''), false);
    should.equal(Utils.default.isValidTransactionId(txIds.hash1.slice(3)), false);
    should.equal(Utils.default.isValidTransactionId(txIds.hash3 + '00'), false);
    should.equal(Utils.default.isValidTransactionId('dalij43ta0ga2dadda02'), false);
  });
});
