import should from 'should';
import utils from '../../src/lib/utils';
import { accounts, blockHash, signatures, txIds } from '../resources/near';

describe('utils', () => {
  it('should validate addresses correctly', () => {
    should.equal(utils.isValidAddress(accounts.account1.address), true);
    should.equal(utils.isValidAddress(accounts.account2.address), true);
    should.equal(utils.isValidAddress(accounts.account3.address), true);
    should.equal(utils.isValidAddress(accounts.account4.address), true);
    should.equal(utils.isValidAddress(accounts.account5.address), true);
  });

  it('should validate block hash correctly', () => {
    should.equal(utils.isValidBlockId(blockHash.block1), true);
    should.equal(utils.isValidBlockId(blockHash.block2), true);
  });

  it('should validate invalid block hash correctly', () => {
    should.equal(utils.isValidBlockId(''), false);
    should.equal(utils.isValidBlockId('0x00'), false);

    should.equal(utils.isValidBlockId(blockHash.block1.slice(2)), false);
    should.equal(utils.isValidBlockId(blockHash.block2 + 'ff'), false);
  });

  it('should validate public key correctly', () => {
    should.equal(utils.isValidPublicKey(accounts.account1.publicKey), true);
    should.equal(utils.isValidPublicKey(accounts.account2.publicKey), true);
    should.equal(utils.isValidPublicKey(accounts.account3.publicKey), true);
    should.equal(utils.isValidPublicKey(accounts.account4.publicKey), true);
  });

  it('should validate private key correctly', () => {
    should.equal(utils.isValidPrivateKey(accounts.account1.secretKey), true);
    should.equal(utils.isValidPrivateKey(accounts.account2.secretKey), true);
    should.equal(utils.isValidPrivateKey(accounts.account3.secretKey), true);
    should.equal(utils.isValidPrivateKey(accounts.account4.secretKey), true);
  });

  it('should validate signature correctly', () => {
    should.equal(utils.isValidSignature(signatures.signature1), true);
    should.equal(utils.isValidSignature(signatures.signature2), true);
    should.equal(utils.isValidSignature(signatures.signature3), true);
  });

  it('should validate invalid signature correctly', () => {
    should.equal(utils.isValidSignature(''), false);
    should.equal(utils.isValidSignature('0x00'), false);

    should.equal(utils.isValidSignature(signatures.signature1.slice(2)), false);
    should.equal(utils.isValidSignature(signatures.signature3 + 'ff'), false);
  });

  it('should validate transaction id correctly', () => {
    should.equal(utils.isValidTransactionId(txIds.id1), true);
    should.equal(utils.isValidTransactionId(txIds.id2), true);
  });

  it('should validate invalid transaction id correctly', () => {
    should.equal(utils.isValidTransactionId(''), false);
    should.equal(utils.isValidTransactionId('0x00'), false);

    should.equal(utils.isValidTransactionId(txIds.id1.slice(2)), false);
    should.equal(utils.isValidTransactionId(txIds.id1 + 'ff'), false);
  });

  it('should not validate addresses correctly', () => {
    should.equal(utils.isValidAddress(accounts.errorsAccounts.address1), false);
    should.equal(utils.isValidAddress(accounts.errorsAccounts.address2), false);
    should.equal(utils.isValidAddress(accounts.errorsAccounts.address3), false);
    should.equal(utils.isValidAddress(accounts.errorsAccounts.address4), false);
    should.equal(utils.isValidAddress(accounts.errorsAccounts.address5), false);
    should.equal(utils.isValidAddress(accounts.errorsAccounts.address6), false);
  });
});
