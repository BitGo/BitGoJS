import assert from 'assert';
import should from 'should';
import { spy, assert as SinonAssert } from 'sinon';
import { StakingBuilder } from '../../../src/lib/stakingBuilder';
import { accounts, mockTssSignature, genesisHash, specVersion, txVersion, chainName } from '../../resources';
import { buildTestConfig } from './base';
import utils from '../../../src/lib/utils';

describe('Tao Stake Builder', function () {
  const referenceBlock = '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d';
  let builder: StakingBuilder;
  const sender = accounts.account1;

  beforeEach(function () {
    const config = buildTestConfig();
    const material = utils.getMaterial(config.network.type);
    builder = new StakingBuilder(config).material(material);
  });

  describe('setter validation', function () {
    it('should validate stake amount', function () {
      const spyValidateValue = spy(builder, 'validateValue');
      assert.throws(
        () => builder.amount(-1),
        (e: Error) => e.message === 'Value cannot be less than zero'
      );
      should.doesNotThrow(() => builder.amount(1000));
      SinonAssert.calledTwice(spyValidateValue);
    });
  });

  describe('build stake transaction', function () {
    it('should build a stake transaction', async function () {
      builder
        .amount(50000000)
        .hotkey('5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT')
        .netuid(0)
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' })
        .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '50000000');
      should.deepEqual(txJson.to, '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT');
      should.deepEqual(txJson.netuid, '0');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build an unsigned stake transaction', async function () {
      builder
        .amount(50000000)
        .hotkey('5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT')
        .netuid(0)
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '50000000');
      should.deepEqual(txJson.to, '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT');
      should.deepEqual(txJson.netuid, '0');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw signed tx', async function () {
      builder.from(
        '0x55028400aaa34f9f3c1f685e2bac444a4e2d50d302a16f0550f732dd799f854dda7ec7720104a0f15c9a7edb361d63f238a2b471007a22035b435cb3408cc8eb4886722e78d6c6094ac095c700e9d98871f4d0a28c06d86027ff74a52ea00db14bea4313824400a105000007028a90be061598f4b592afbd546bcb6beadb3c02f5c129df2e11b698f9543dbd41000000e1f50500000000'
      );
      builder.validity({ firstValid: 3933, maxDuration: 64 }).referenceBlock(referenceBlock);
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '100000000');
      should.deepEqual(txJson.to, '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT');
      should.deepEqual(txJson.netuid, '0');
      should.deepEqual(txJson.sender, '5FvSWbV4hGC7GvXQKKtiVmmHSH3JELK8R3JS8Z5adnACFBwh');
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 360);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    // it('should build from raw unsigned tx', async function () {
    //   builder.from(rawTx.stake.unsigned);
    //   builder
    //     .validity({ firstValid: 3933, maxDuration: 64 })
    //     .referenceBlock(referenceBlock)
    //     .sender({ address: '5F1mFBGhm7FrSKftDxzFPN8U1BqHKSAxEDhTV2Yx5JhCe2Nk' })
    //     .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
    //   const tx = await builder.build();
    //   const txJson = tx.toJson();
    //   // should.deepEqual(txJson.amount, '5000000000000');
    //   // should.deepEqual(txJson.hotkey, 'validHotkey');
    //   // should.deepEqual(txJson.netuid, 'validNetuid');
    //   should.deepEqual(txJson.sender, '5F1mFBGhm7FrSKftDxzFPN8U1BqHKSAxEDhTV2Yx5JhCe2Nk');
    //   should.deepEqual(txJson.blockNumber, 3933);
    //   should.deepEqual(txJson.referenceBlock, referenceBlock);
    //   should.deepEqual(txJson.genesisHash, genesisHash);
    //   should.deepEqual(txJson.specVersion, specVersion);
    //   should.deepEqual(txJson.nonce, 0);
    //   should.deepEqual(txJson.tip, 0);
    //   should.deepEqual(txJson.transactionVersion, txVersion);
    //   should.deepEqual(txJson.chainName, chainName);
    //   should.deepEqual(txJson.eraPeriod, 64);
    // });
  });
});
