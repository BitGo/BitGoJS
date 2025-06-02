import assert from 'assert';
import should from 'should';
import sinon from 'sinon';
import { RegisterDidWithCDDBuilder } from '../../../src/lib';
import { utils } from '../../../src';

import { accounts, rawTx, chainName, genesisHash, mockTssSignature } from '../../resources';
import { buildTestConfig } from './base';
import { testnetMaterial } from '../../../src/resources';

describe('Polyx Register DID with CDD builder Builder', () => {
  let builder: RegisterDidWithCDDBuilder;

  const sender = accounts.cddProvider;
  const receiver = accounts.account2;

  beforeEach(() => {
    const config = buildTestConfig();
    builder = new RegisterDidWithCDDBuilder(config).material(utils.getMaterial(config.network.type));
  });

  describe('setter validation', () => {
    it('should validate to address', () => {
      const spy = sinon.spy(builder, 'validateAddress');
      assert.throws(
        () => builder.to({ address: 'asd' }),
        (e: Error) => e.message === `The address 'asd' is not a well-formed dot address`
      );
      should.doesNotThrow(() => builder.to({ address: sender.address }));
      sinon.assert.calledTwice(spy);
    });
  });

  describe('build transfer transaction', () => {
    it('should build a register did with cdd transaction', async () => {
      builder
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '0');
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName, testnetMaterial.chainName);
      should.deepEqual(txJson.eraPeriod, 64);

      const inputs = tx.inputs[0];
      should.deepEqual(inputs.address, sender.address);
      should.deepEqual(inputs.value, '0');

      const outputs = tx.outputs[0];
      should.deepEqual(outputs.address, receiver.address);
      should.deepEqual(outputs.value, '0');
    });

    it('should build a transaction with zero maxDuration (immortal)', async () => {
      builder
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 0 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '0');
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, 0);

      const inputs = tx.inputs[0];
      should.deepEqual(inputs.address, sender.address);
      should.deepEqual(inputs.value, '0');

      const outputs = tx.outputs[0];
      should.deepEqual(outputs.address, receiver.address);
      should.deepEqual(outputs.value, '0');
    });

    it('should build an unsigned transfer transaction', async () => {
      builder
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '0');
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw signed tx', async () => {
      builder.from(rawTx.cddTransaction.signed);
      builder
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '0');
      should.deepEqual(txJson.to, '5EFWg5wKTgkFE9XCxigBYPYKQg173djwSmRbkALCdL1jFVUU');
      should.deepEqual(txJson.sender, '5E7XWJRysj27EzibT4duRxrBQT9Qfa7Z5nAAvJmvd32nhkjH');
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 1);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw unsigned tx', async () => {
      builder.from(rawTx.cddTransaction.unsigned);
      builder
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: sender.address })
        .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '0');
      should.deepEqual(txJson.to, '5EFWg5wKTgkFE9XCxigBYPYKQg173djwSmRbkALCdL1jFVUU');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 1);
      should.deepEqual(txJson.eraPeriod, 64);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName, chainName);
    });
  });
});
