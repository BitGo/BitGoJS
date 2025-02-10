// modules/sdk-coin-tao/test/unit/transactionBuilder/stakingBuilder.test.ts
import assert from 'assert';
import should from 'should';
import { spy, assert as SinonAssert } from 'sinon';
import { StakingBuilder } from '../../../src/lib/stakingBuilder';
import utils from '../../../src/lib/utils';
import { buildTestConfig } from './base';

describe('Tao Stake Builder', () => {
  const referenceBlock = '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d';
  const genesisHash = '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e';
  const specVersion = 9430;
  const txVersion = 22;
  let builder: StakingBuilder;

  const sender = {
    address: '5FvSWbV4hGC7GvXQKKtiVmmHSH3JELK8R3JS8Z5adnACFBwh',
    publicKey: '0x1234567890abcdef',
  };

  beforeEach(() => {
    const config = buildTestConfig();
    builder = new StakingBuilder(config).material(utils.getMaterial(config));
  });

  describe('setter validation', () => {
    it('should validate stake amount', () => {
      const spyValidateValue = spy(builder, 'validateValue');
      assert.throws(
        () => builder.amount('-1'),
        (e: Error) => e.message === 'Value cannot be less than zero'
      );
      should.doesNotThrow(() => builder.amount('1000'));
      SinonAssert.calledTwice(spyValidateValue);
    });

    it('should validate controller address', () => {
      const spyValidateAddress = spy(builder, 'validateAddress');
      assert.throws(
        () => builder.owner({ address: 'asd' }),
        (e: Error) => e.message === `The address 'asd' is not a well-formed dot address`
      );
      should.doesNotThrow(() => builder.owner({ address: sender.address }));
      SinonAssert.calledTwice(spyValidateAddress);
    });

    it('should validate payee', () => {
      const spyValidateAddress = spy(builder, 'validateAddress');
      assert.throws(
        () => builder.payee({ Account: 'asd' }),
        (e: Error) => e.message === `The address 'asd' is not a well-formed dot address`
      );
      should.doesNotThrow(() => builder.payee({ Account: sender.address }));
      should.doesNotThrow(() => builder.payee('Staked'));
      should.doesNotThrow(() => builder.payee('Controller'));
      should.doesNotThrow(() => builder.payee('Stash'));
      SinonAssert.calledTwice(spyValidateAddress);
    });
  });

  describe('build stake transaction', () => {
    it('should build a stake transaction', async () => {
      builder
        .amount('100000000')
        .owner({ address: sender.address })
        .payee('Staked')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' })
        .addSignature({ pub: sender.publicKey }, Buffer.from('0x1234567890abcdef', 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '100000000');
      should.deepEqual(txJson.controller, sender.address);
      should.deepEqual(txJson.payee, 'Staked');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'chainName');
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build an unsigned stake transaction', async () => {
      builder
        .amount('100000000')
        .owner({ address: sender.address })
        .payee('Staked')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '100000000');
      should.deepEqual(txJson.controller, sender.address);
      should.deepEqual(txJson.payee, 'Staked');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'chainName');
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw signed tx', async () => {
      builder.from('0x1234567890abcdef');
      builder.validity({ firstValid: 3933 }).referenceBlock(referenceBlock);

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '100000000');
      should.deepEqual(txJson.controller, sender.address);
      should.deepEqual(txJson.payee, 'Staked');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'chainName');
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw unsigned tx', async () => {
      builder.from('0x1234567890abcdef');
      builder.sender({ address: sender.address }).validity({ firstValid: 3933, maxDuration: 64 });

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '100000000');
      should.deepEqual(txJson.controller, sender.address);
      should.deepEqual(txJson.payee, 'Staked');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'chainName');
      should.deepEqual(txJson.eraPeriod, 64);
    });
  });

  describe('build stake more transaction', () => {
    it('should build a stake more transaction', async () => {
      builder
        .addToStake(true)
        .amount('100000000')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' })
        .addSignature({ pub: sender.publicKey }, Buffer.from('0x1234567890abcdef', 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '100000000');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'chainName');
      should.deepEqual(txJson.eraPeriod, 64);

      const txHex = tx.toBroadcastFormat();
      should.deepEqual('0x1234567890abcdef', txHex);
    });

    it('should build an unsigned stake more transaction', async () => {
      builder
        .addToStake(true)
        .amount('100000000')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '100000000');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'chainName');
      should.deepEqual(txJson.eraPeriod, 64);

      const txHex = tx.toBroadcastFormat();
      should.deepEqual('0x1234567890abcdef', txHex);
    });

    it('should build from a stake more raw signed tx', async () => {
      builder.from('0x1234567890abcdef');
      builder.validity({ firstValid: 3933, maxDuration: 64 }).referenceBlock(referenceBlock);

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '100000000');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'chainName');
      should.deepEqual(txJson.eraPeriod, 64);

      const txHex = tx.toBroadcastFormat();
      should.deepEqual('0x1234567890abcdef', txHex);
    });

    it('should build from a stake more raw unsigned tx', async () => {
      builder.from('0x1234567890abcdef');
      builder.sender({ address: sender.address }).validity({ firstValid: 3933, maxDuration: 64 });

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '100000000');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'chainName');
      should.deepEqual(txJson.eraPeriod, 64);

      const txHex = tx.toBroadcastFormat();
      should.deepEqual('0x1234567890abcdef', txHex);
    });
  });
});
