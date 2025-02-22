import assert from 'assert';
import should from 'should';
import sinon from 'sinon';
import { TransferBuilder } from '../../../src/lib';
import { utils } from '../../../src';

import { accounts, rawTx, chainName, genesisHash, mockTssSignature } from '../../resources';
import { buildTestConfig } from './base';
import { testnetMaterial } from '../../../src/resources';
import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory } from "@bitgo/sdk-coin-tao";

describe('Tao Transfer Builder', () => {
  let builder: TransferBuilder;

  const sender = accounts.account1;
  const receiver = accounts.account2;

  // Consolidation/sweep tx's do not deseialize amounts.
  const consolidationValue = '0';

  beforeEach(() => {
    const config = buildTestConfig();
    builder = new TransferBuilder(config).material(utils.getMaterial(config.network.type));
  });

  describe('setter validation', () => {
    it('should validate to address', () => {
      const coin = coins.get('tao');
      const factory = new TransactionBuilderFactory(coin);
      // signed
      factory.from(
        '0x55028400aaa34f9f3c1f685e2bac444a4e2d50d302a16f0550f732dd799f854dda7ec772013c7faf171926bc568de06a38aaa15c86231bfabd2d561cc9107a95b5bea53943b01dd19f790956e6b84bda1eb44cd00ac11cecf76488d15beacb0c88d91a448e74009105000007028a90be061598f4b592afbd546bcb6beadb3c02f5c129df2e11b698f9543dbd41000000e1f50500000000'
      );
      const spy = sinon.spy(builder, 'validateAddress');
      assert.throws(
        () => builder.to({ address: 'asd' }),
        (e: Error) => e.message === `The address 'asd' is not a well-formed dot address`
      );
      should.doesNotThrow(() => builder.to({ address: sender.address }));
      sinon.assert.calledTwice(spy);
    });
    it('should validate transfer amount', () => {
      const spy = sinon.spy(builder, 'validateValue');
      assert.throws(
        () => builder.amount('-1'),
        (e: Error) => e.message === 'Value cannot be less than zero'
      );
      should.doesNotThrow(() => builder.amount('1000'));
      sinon.assert.calledTwice(spy);
    });
  });

  describe('build transfer transaction', () => {
    it('should build a transfer transaction', async () => {
      builder
        .amount('90034235235322')
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '90034235235322');
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
      should.deepEqual(inputs.value, '90034235235322');

      const outputs = tx.outputs[0];
      should.deepEqual(outputs.address, receiver.address);
      should.deepEqual(outputs.value, '90034235235322');
    });

    it('should build a transaction with zero maxDuration (immortal)', async () => {
      builder
        .amount('90034235235322')
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 0 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '90034235235322');
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName.toLowerCase(), chainName);
      should.deepEqual(txJson.eraPeriod, 0);

      const inputs = tx.inputs[0];
      should.deepEqual(inputs.address, sender.address);
      should.deepEqual(inputs.value, '90034235235322');

      const outputs = tx.outputs[0];
      should.deepEqual(outputs.address, receiver.address);
      should.deepEqual(outputs.value, '90034235235322');
    });

    it('should build an unsigned transfer transaction', async () => {
      builder
        .amount('90034235235322')
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '90034235235322');
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName.toLowerCase(), chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw signed tx', async () => {
      builder.from(rawTx.transfer.signed);
      builder
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '2');
      should.deepEqual(txJson.to, '5EQZSJmHuFH8asYYJruSRwpJmE5aqSdhdiX9oxRbxujKUkTe');
      should.deepEqual(txJson.sender, '5H56KVtb3sSMxuhFsH51iFi1gei7tnBQjpVmj6hu9tK7CBDR');
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 17);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName.toLowerCase(), chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw unsigned tx', async () => {
      builder.from(rawTx.transfer.unsigned);
      builder
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: sender.address })
        .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '2');
      should.deepEqual(txJson.to, '5EQZSJmHuFH8asYYJruSRwpJmE5aqSdhdiX9oxRbxujKUkTe');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 17);
      should.deepEqual(txJson.eraPeriod, 64);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName.toLowerCase(), chainName);
    });
  });

  describe('build sweep transfer transaction', () => {
    it('should build a signed sweep transaction', async () => {
      builder
        .sweep()
        .to({ address: receiver.address })
        .amount('90034235235322')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' })
        .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName.toLowerCase(), chainName);
      should.deepEqual(txJson.eraPeriod, 64);

      const inputs = tx.inputs[0];
      should.deepEqual(inputs.address, sender.address);
      should.deepEqual(inputs.value, consolidationValue);

      const outputs = tx.outputs[0];
      should.deepEqual(outputs.address, receiver.address);
      should.deepEqual(outputs.value, consolidationValue);
    });

    it('should build an unsigned sweep transaction', async () => {
      builder
        .sweep()
        .to({ address: receiver.address })
        .amount('90034235235322')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName.toLowerCase(), chainName);
      should.deepEqual(txJson.eraPeriod, 64);

      const inputs = tx.inputs[0];
      should.deepEqual(inputs.address, sender.address);
      should.deepEqual(inputs.value, consolidationValue);

      const outputs = tx.outputs[0];
      should.deepEqual(outputs.address, receiver.address);
      should.deepEqual(outputs.value, consolidationValue);
    });

    it('should build an unsigned sweep transaction with keepAlive as false', async () => {
      builder
        .sweep(false)
        .to({ address: receiver.address })
        .amount('90034235235322')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName.toLowerCase(), chainName);
      should.deepEqual(txJson.eraPeriod, 64);

      const inputs = tx.inputs[0];
      should.deepEqual(inputs.address, sender.address);
      should.deepEqual(inputs.value, consolidationValue);

      const outputs = tx.outputs[0];
      should.deepEqual(outputs.address, receiver.address);
      should.deepEqual(outputs.value, consolidationValue);
    });

    it('should build from raw signed sweep transaction', async () => {
      builder.from(rawTx.transferAll.signed);
      builder
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, '5H56KVtb3sSMxuhFsH51iFi1gei7tnBQjpVmj6hu9tK7CBDR');
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 17);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName.toLowerCase(), chainName);
      should.deepEqual(txJson.eraPeriod, 64);

      const inputs = tx.inputs[0];
      should.deepEqual(inputs.address, '5H56KVtb3sSMxuhFsH51iFi1gei7tnBQjpVmj6hu9tK7CBDR');
      should.deepEqual(inputs.value, consolidationValue);

      const outputs = tx.outputs[0];
      should.deepEqual(outputs.address, '5EQZSJmHuFH8asYYJruSRwpJmE5aqSdhdiX9oxRbxujKUkTe');
      should.deepEqual(outputs.value, consolidationValue);
    });

    it('should build from an unsigned sweep transaction', async () => {
      builder.from(rawTx.transferAll.unsigned);
      builder
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: sender.address })
        .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 17);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName.toLowerCase(), chainName);
      should.deepEqual(txJson.eraPeriod, 64);

      const inputs = tx.inputs[0];
      should.deepEqual(inputs.address, sender.address);
      should.deepEqual(inputs.value, consolidationValue);

      const outputs = tx.outputs[0];
      should.deepEqual(outputs.address, '5EQZSJmHuFH8asYYJruSRwpJmE5aqSdhdiX9oxRbxujKUkTe');
      should.deepEqual(outputs.value, consolidationValue);
    });
  });
});
