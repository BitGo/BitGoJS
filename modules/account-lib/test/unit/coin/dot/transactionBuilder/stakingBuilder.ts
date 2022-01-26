import should from 'should';
import sinon, { assert } from 'sinon';
import { StakingBuilder } from '../../../../../src/coin/dot';
import utils from '../../../../../src/coin/dot/utils';
import * as DotResources from '../../../../resources/dot';
import { buildTestConfig } from './base';

describe('Dot Stake Builder', () => {
  let builder: StakingBuilder;

  const sender = DotResources.accounts.account1;
  const receiver = DotResources.accounts.account2;
  const config = buildTestConfig();
  const materialData = utils.getMaterial(config);

  beforeEach(() => {
    builder = new StakingBuilder(config).material(materialData);
  });
  describe('setter validation', () => {
    it('should validate stake amount', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.amount('-1'),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.amount('1000'));
      assert.calledTwice(spy);
    });

    it('should validate controller address', () => {
      const spy = sinon.spy(builder, 'validateAddress');
      should.throws(
        () => builder.owner({ address: 'asd' }),
        (e: Error) => e.message === `The address 'asd' is not a well-formed dot address`,
      );
      should.doesNotThrow(() => builder.owner({ address: sender.address }));
      assert.calledTwice(spy);
    });

    it('should validate payee', () => {
      const spy = sinon.spy(builder, 'validateAddress');
      should.throws(
        () => builder.payee({ Account: 'asd' }),
        (e: Error) => e.message === `The address 'asd' is not a well-formed dot address`,
      );
      should.doesNotThrow(() => builder.payee({ Account: sender.address }));
      should.doesNotThrow(() => builder.payee('Staked'));
      should.doesNotThrow(() => builder.payee('Controller'));
      should.doesNotThrow(() => builder.payee('Stash'));
      assert.calledTwice(spy);
    });
  });

  describe('build stake transaction', () => {
    it('should build a stake transaction', async () => {
      builder
        .amount('90034235235322')
        .owner({ address: receiver.address })
        .payee('Staked')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      builder.sign({ key: sender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '90034235235322');
      should.deepEqual(txJson.controller, receiver.address);
      should.deepEqual(txJson.payee, 'Staked');
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

    it('should build an unsigned stake transaction', async () => {
      builder
        .amount('90034235235322')
        .owner({ address: receiver.address })
        .payee('Staked')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '90034235235322');
      should.deepEqual(txJson.controller, receiver.address);
      should.deepEqual(txJson.payee, 'Staked');
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
      builder.from(DotResources.rawTx.stake.signed);
      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '90034235235322');
      should.deepEqual(txJson.controller, receiver.address);
      should.deepEqual(txJson.payee, 'Staked');
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
      builder.from(DotResources.rawTx.stake.unsigned);
      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: sender.address })
        .sign({ key: sender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '90034235235322');
      should.deepEqual(txJson.controller, receiver.address);
      should.deepEqual(txJson.payee, 'Staked');
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

    it('should build from raw signed tx with receiver account', async () => {
      builder.from(DotResources.rawTx.stake.signedAlt);
      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '90034235235322');
      should.deepEqual(txJson.controller, receiver.address);
      should.deepEqual(txJson.payee, receiver.address);
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

    it('should build from raw unsigned tx with payee account', async () => {
      builder.from(DotResources.rawTx.stake.unsignedAlt);
      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: sender.address })
        .sign({ key: sender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '90034235235322');
      should.deepEqual(txJson.controller, receiver.address);
      should.deepEqual(txJson.payee, receiver.address);
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
  });
});
