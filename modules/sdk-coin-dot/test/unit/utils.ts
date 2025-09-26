import { DotAddressFormat } from '@bitgo/sdk-core';
import { TypeRegistry } from '@substrate/txwrapper-core/lib/types';
import should from 'should';
import { SingletonRegistry } from '../../src';
import utils from '../../src/lib/utils';
import { accounts, blockHash, signatures, txIds, rawTx } from '../resources';
import * as material from '../resources/materialData.json';

describe('utils', () => {
  const registry: TypeRegistry = SingletonRegistry.getInstance(material);
  it('should validate addresses correctly', () => {
    should.equal(utils.isValidAddress(accounts.account1.address), true);
    should.equal(utils.isValidAddress(accounts.account2.address), true);
    should.equal(utils.isValidAddress(accounts.account3.address), true);
    should.equal(utils.isValidAddress(accounts.account4.address), true);
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

  it('should validate base58 key correctly', () => {
    should.equal(utils.isValidPublicKey(accounts.bs58Account.publicKey), true);
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

  it('should capitalize first letter correctly', () => {
    should.equal(utils.capitalizeFirstLetter('polkadot'), 'Polkadot');
  });

  it('should decode DOT address correctly', () => {
    should.equal(
      utils.decodeDotAddress(accounts.account1.address, DotAddressFormat.substrate),
      '5EGoFA95omzemRssELLDjVenNZ68aXyUeqtKQScXSEBvVJkr'
    );
  });

  it('should encode DOT address correctly', () => {
    should.equal(
      utils.encodeDotAddress(accounts.account1.address, DotAddressFormat.substrate),
      '5EGoFA95omzemRssELLDjVenNZ68aXyUeqtKQScXSEBvVJkr'
    );
  });

  it('should recover signature from raw tx correctly', () => {
    should.equal(
      utils.recoverSignatureFromRawTx(rawTx.transfer.signed, { registry: registry }),
      'b6d868a11d202b56df1959f5d5f81f44ce1f95c8e70424b17080ea869d1c39d453f16c38fbef600a636c9a62a49ede5ee695a1822faf2f94fcfbb184a4254009'
    );
  });

  it('should serialize signed transaction successfully', () => {
    const signature = utils.recoverSignatureFromRawTx(rawTx.transfer.signed, { registry: registry });
    const txHex = utils.serializeSignedTransaction(
      rawTx.transfer.unsigned,
      signature.replace(/^/, '0x00'),
      material.metadata as `0x${string}`,
      registry
    );
    should.equal(
      txHex,
      '0xad018400000000000000000000000000000000000000000000000000000000000000000000b6d868a11d202b56df1959f5d5f81f44ce1f95c8e70424b17080ea869d1c39d453f16c38fbef600a636c9a62a49ede5ee695a1822faf2f94fcfbb184a4254009d501210300000000'
    );
  });
});
