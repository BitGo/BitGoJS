import should from 'should';
import sinon from 'sinon';
import { WithdrawUnstakedBuilder } from '../../../../../src/coin/dot';
import { buildTestConfig } from './base';
import { accounts, rawTx } from '../../../../resources/dot';
import utils from '../../../../../src/coin/dot/utils';
import { Networks } from '@bitgo/statics';

describe('Dot WithdrawUnstaked Builder', () => {
  let builder: WithdrawUnstakedBuilder;

  const sender = accounts.account1;
  const refBlock = '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d';
  const { specVersion, txVersion, chainName, genesisHash } = Networks.test.dot;

  beforeEach(() => {
    const config = buildTestConfig();
    builder = new WithdrawUnstakedBuilder(config).material(utils.getMaterial(config));
  });

  describe('setter validation', () => {
    it('should validate slashing spans', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.slashingSpans(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.slashingSpans(10));
      sinon.assert.calledTwice(spy);
    });
  });

  describe('build withdrawUnstaked transaction', () => {
    it('should build a withdrawUnstaked transaction', async () => {
      builder
        .slashingSpans(0)
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(refBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      builder.sign({ key: sender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.numSlashingSpans, '0');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, refBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build an unsigned withdrawUnstaked transaction', async () => {
      builder
        .slashingSpans(0)
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(refBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.numSlashingSpans, '0');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, refBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw signed tx', async () => {
      builder.from(rawTx.withdrawUnbonded.signed);
      builder.validity({ firstValid: 3933 }).referenceBlock(refBlock);
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.numSlashingSpans, '0');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, refBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw unsigned tx', async () => {
      builder.from(rawTx.withdrawUnbonded.unsigned);
      builder
        .validity({ firstValid: 3933 })
        .referenceBlock(refBlock)
        .sender({ address: sender.address })
        .sign({ key: sender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.numSlashingSpans, '0');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, refBlock);
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
