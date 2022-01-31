import { coins, Networks } from '@bitgo/statics';
import should from 'should';
import sinon, { assert } from 'sinon';
import { TransferBuilder } from '../../../../../src/coin/dot';
import * as DotResources from '../../../../resources/dot';
import { buildTestConfig } from './base';
import { ProxyType } from '../../../../../src/coin/dot/iface';
import utils from '../../../../../src/coin/dot/utils';

describe('Dot Transfer Builder', () => {
  let builder: TransferBuilder;

  const proxySender = DotResources.accounts.account3;
  const sender = DotResources.accounts.account1;
  const receiver = DotResources.accounts.account2;
  const materialData = Networks.test.dot;
  const config = buildTestConfig();
  const material = utils.getMaterial(config);

  beforeEach(() => {
    builder = new TransferBuilder(config).material(material);
  });
  describe('setter validation', () => {
    it('should validate real address', () => {
      const spy = sinon.spy(builder, 'validateAddress');
      should.throws(
        () => builder.owner({ address: 'asd' }),
        (e: Error) => e.message === `The address 'asd' is not a well-formed dot address`,
      );
      should.doesNotThrow(() => builder.owner({ address: sender.address }));
      assert.calledTwice(spy);
    });
    it('should validate to address', () => {
      const spy = sinon.spy(builder, 'validateAddress');
      should.throws(
        () => builder.to({ address: 'asd' }),
        (e: Error) => e.message === `The address 'asd' is not a well-formed dot address`,
      );
      should.doesNotThrow(() => builder.to({ address: sender.address }));
      assert.calledTwice(spy);
    });
    it('should validate transfer amount', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.amount('-1'),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.amount('1000'));
      assert.calledTwice(spy);
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
      builder.sign({ key: sender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '90034235235322');
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, materialData.genesisHash);
      should.deepEqual(txJson.specVersion, materialData.specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, materialData.txVersion);
      should.deepEqual(txJson.chainName, materialData.chainName);
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
      builder.sign({ key: sender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '90034235235322');
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, materialData.genesisHash);
      should.deepEqual(txJson.specVersion, materialData.specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, materialData.txVersion);
      should.deepEqual(txJson.chainName, materialData.chainName);
      should.deepEqual(txJson.eraPeriod, 64);

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
      should.deepEqual(txJson.genesisHash, materialData.genesisHash);
      should.deepEqual(txJson.specVersion, materialData.specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, materialData.txVersion);
      should.deepEqual(txJson.chainName, materialData.chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw signed tx', async () => {
      builder.from(DotResources.rawTx.transfer.signed);
      builder
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '90034235235322');
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, materialData.genesisHash);
      should.deepEqual(txJson.specVersion, materialData.specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, materialData.txVersion);
      should.deepEqual(txJson.chainName, materialData.chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw unsigned tx', async () => {
      builder.from(DotResources.rawTx.transfer.unsigned);
      builder
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: sender.address })
        .sign({ key: sender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '90034235235322');
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, materialData.genesisHash);
      should.deepEqual(txJson.specVersion, materialData.specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.eraPeriod, 64);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, materialData.txVersion);
      should.deepEqual(txJson.chainName, materialData.chainName);
    });

    it('should build from raw signed westend tx', async () => {
      const config = coins.get('tdot');
      const westendBuilder = new TransferBuilder(config);
      westendBuilder.from(DotResources.rawTx.transfer.westendSigned);
      westendBuilder
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      const tx = await westendBuilder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '10000000000');
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e');
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, 8);
      should.deepEqual(txJson.eraPeriod, 64);
    });
  });

  describe('build proxy transfer transaction', () => {
    it('should build a proxy transaction', async () => {
      builder
        .owner({ address: sender.address })
        .forceProxyType(ProxyType.ANY)
        .to({ address: receiver.address })
        .amount('90034235235322')
        .sender({ address: proxySender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      builder.sign({ key: proxySender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.owner, sender.address);
      should.deepEqual(txJson.forceProxyType, ProxyType.ANY);
      should.deepEqual(txJson.sender, proxySender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, materialData.genesisHash);
      should.deepEqual(txJson.specVersion, materialData.specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, materialData.txVersion);
      should.deepEqual(txJson.chainName, materialData.chainName);
      should.deepEqual(txJson.eraPeriod, 64);

      const inputs = tx.inputs[0];
      should.deepEqual(inputs.address, sender.address);
      should.deepEqual(inputs.value, '90034235235322');

      const outputs = tx.outputs[0];
      should.deepEqual(outputs.address, receiver.address);
      should.deepEqual(outputs.value, '90034235235322');
    });

    it('should build an unsigned proxy transaction', async () => {
      builder
        .owner({ address: sender.address })
        .forceProxyType(ProxyType.ANY)
        .to({ address: receiver.address })
        .amount('90034235235322')
        .sender({ address: proxySender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.owner, sender.address);
      should.deepEqual(txJson.forceProxyType, ProxyType.ANY);
      should.deepEqual(txJson.sender, proxySender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, materialData.genesisHash);
      should.deepEqual(txJson.specVersion, materialData.specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, materialData.txVersion);
      should.deepEqual(txJson.chainName, materialData.chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw signed tx', async () => {
      builder.from(DotResources.rawTx.proxy.signed);
      builder
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.owner, sender.address);
      should.deepEqual(txJson.forceProxyType, ProxyType.ANY);
      should.deepEqual(txJson.sender, proxySender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, materialData.genesisHash);
      should.deepEqual(txJson.specVersion, materialData.specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, materialData.txVersion);
      should.deepEqual(txJson.chainName, materialData.chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw unsigned tx', async () => {
      builder.from(DotResources.rawTx.proxy.unsigned);
      builder
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: proxySender.address })
        .sign({ key: proxySender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.owner, sender.address);
      should.deepEqual(txJson.forceProxyType, ProxyType.ANY);
      should.deepEqual(txJson.sender, proxySender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, materialData.genesisHash);
      should.deepEqual(txJson.specVersion, materialData.specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.eraPeriod, 64);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, materialData.txVersion);
      should.deepEqual(txJson.chainName, materialData.chainName);
    });
  });
});
