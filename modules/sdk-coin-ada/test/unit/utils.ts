import should from 'should';
import { Utils } from '../../src/utils';
import { toHex } from '@bitgo/sdk-core';
import { Ed25519Signature } from '@emurgo/cardano-serialization-lib-nodejs';
import { address, blockHash, signatures, txIds, privateKeys, publicKeys } from '../resources';

describe('utils', () => {
  const utils = new Utils();

  it('should validate addresses correctly', () => {
    should.equal(utils.isValidAddress(address.address1), true);
    should.equal(utils.isValidAddress(address.address2), true);
    should.equal(utils.isValidAddress(address.address3), false);
    should.equal(utils.isValidAddress(address.address4), true);
    should.equal(utils.isValidAddress('dfjk35y'), false);
  });

  it('should validate block hash correctly', () => {
    should.equal(utils.isValidBlockId(blockHash.hash1), true);
    should.equal(utils.isValidBlockId(blockHash.hash2), true);
  });

  it('should validate invalid block hash correctly', () => {
    should.equal(utils.isValidBlockId(''), false);
    should.equal(utils.isValidBlockId('0xade35465gfvdcsxsz24300'), false);
    should.equal(utils.isValidBlockId(blockHash.hash2 + 'ff'), false);
  });

  it('should validate public key correctly', () => {
    should.equal(utils.isValidPublicKey(publicKeys.pubKey1), true);
    should.equal(utils.isValidPublicKey(publicKeys.pubKey2), true);
    should.equal(utils.isValidPublicKey(publicKeys.pubKey3), true);
    should.equal(utils.isValidPublicKey(publicKeys.pubKey4), false);
  });

  it('should validate private key correctly', () => {
    should.equal(utils.isValidPrivateKey(privateKeys.prvKeyExtended), true);
    should.equal(utils.isValidPrivateKey(privateKeys.prvKey2), true);
    should.equal(utils.isValidPrivateKey(privateKeys.prvKey3WrongFormat), false);
    should.equal(utils.isValidPrivateKey(privateKeys.prvKey4), true);
    should.equal(utils.isValidPrivateKey(privateKeys.prvKey5WrongFormat), false);
  });

  it('should validate signature correctly', () => {
    should.equal(utils.isValidSignature(toHex(Ed25519Signature.from_bech32(signatures.signature1).to_bytes())), true);
    should.equal(utils.isValidSignature(toHex(Ed25519Signature.from_bech32(signatures.signature2).to_bytes())), true);
  });

  it('should validate invalid signature correctly', () => {
    should.equal(utils.isValidSignature(''), false);
    should.equal(utils.isValidSignature('0x00'), false);
    should.equal(utils.isValidSignature(privateKeys.prvKeyExtended), false);
    should.equal(utils.isValidSignature(signatures.signature1.slice(2)), false);
    should.equal(utils.isValidSignature(signatures.signature2 + 'ff'), false);
  });

  it('should validate transaction id correctly', () => {
    should.equal(utils.isValidTransactionId(txIds.hash1), true);
    should.equal(utils.isValidTransactionId(txIds.hash2), true);
    should.equal(utils.isValidTransactionId(txIds.hash3), true);
  });

  it('should validate invalid transaction id correctly', () => {
    should.equal(utils.isValidTransactionId(''), false);
    should.equal(utils.isValidTransactionId(txIds.hash1.slice(3)), false);
    should.equal(utils.isValidTransactionId(txIds.hash3 + '00'), false);
    should.equal(utils.isValidTransactionId('dalij43ta0ga2dadda02'), false);
  });
});
