import assert from 'assert';
import should from 'should';
import { spy, assert as SinonAssert } from 'sinon';
import { UnstakeBuilder } from '../../../src/lib';
import utils from '../../../src/lib/utils';
import { rawTx, accounts, specVersion, txVersion, chainName, genesisHash, mockTssSignature } from '../../resources';
import { buildTestConfig } from './base';

describe('Dot Unstake Builder', () => {
  let builder: UnstakeBuilder;

  const sender = accounts.account1;

  beforeEach(() => {
    const config = buildTestConfig();
    builder = new UnstakeBuilder(config).material(utils.getMaterial(config));
  });

  describe('setter validation', () => {
    it('should validate unstake amount', () => {
      const spyValidateValue = spy(builder, 'validateValue');
      assert.throws(
        () => builder.amount('-1'),
        (e: Error) => e.message === 'Value cannot be less than zero'
      );
      should.doesNotThrow(() => builder.amount('1000'));
      SinonAssert.calledTwice(spyValidateValue);
    });
  });

  describe('build unstake transaction', () => {
    it('should build a unstake transaction', async () => {
      builder
        .amount('50000000000000')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '50000000000000');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build an unsigned unstake transaction', async () => {
      builder
        .amount('50000000000000')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '50000000000000');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw signed tx', async () => {
      builder.from(rawTx.unstake.signed);
      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '50000000000000');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw unsigned tx', async () => {
      builder.from(rawTx.unstake.unsigned);
      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: sender.address })
        .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '50000000000000');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.eraPeriod, 64);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, chainName);
    });
  });
});
