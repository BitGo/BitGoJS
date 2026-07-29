import assert from 'assert';
import should from 'should';
import { assert as SinonAssert, spy } from 'sinon';
import { TokenTransferBuilder } from '../../../src/lib/tokenTransferBuilder';
import utils from '../../../src/lib/utils';
import { accounts, mockTssSignature, rawTx } from '../../resources';
import { buildTestConfig } from './base';

describe('Tao Token Transfer Builder', function () {
  const referenceBlock = '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d';
  let builder: TokenTransferBuilder;
  const sender = accounts.account1;

  beforeEach(function () {
    const config = buildTestConfig();
    const material = utils.getMaterial(config.network.type);
    builder = new TokenTransferBuilder(config).material(material);
  });

  describe('setter validation', function () {
    it('should validate amount', function () {
      const spyValidateValue = spy(builder, 'validateValue');
      assert.throws(
        () => builder.amount('-1'),
        (e: Error) => e.message === 'Value cannot be less than zero'
      );
      should.doesNotThrow(() => builder.amount('1000'));
      SinonAssert.calledTwice(spyValidateValue);
    });

    it('should validate address', function () {
      const spyValidateAddress = spy(builder, 'validateAddress');
      assert.throws(
        () => builder.hotkey('abc'),
        (e: Error) => e.message === `The address 'abc' is not a well-formed dot address`
      );
      assert.throws(
        () => builder.destinationColdkey('abc'),
        (e: Error) => e.message === `The address 'abc' is not a well-formed dot address`
      );
      should.doesNotThrow(() => builder.hotkey('5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT'));
      should.doesNotThrow(() => builder.destinationColdkey('5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT'));

      SinonAssert.callCount(spyValidateAddress, 4);
    });

    it('should validate netuid', function () {
      const spyValidateAddress = spy(builder, 'validateNetuid');
      assert.throws(
        () => builder.destinationNetuid('abc'),
        (e: Error) => e.message === `Cannot convert abc to a BigInt`
      );
      assert.throws(
        () => builder.destinationNetuid('-10'),
        (e: Error) => e.message === `The netuid '-10' is not a valid netuid`
      );
      should.doesNotThrow(() => builder.destinationNetuid('36'));

      assert.throws(
        () => builder.originNetuid('abc'),
        (e: Error) => e.message === `Cannot convert abc to a BigInt`
      );
      assert.throws(
        () => builder.destinationNetuid('-1'),
        (e: Error) => e.message === `The netuid '-1' is not a valid netuid`
      );
      should.doesNotThrow(() => builder.originNetuid('64'));

      SinonAssert.callCount(spyValidateAddress, 6);
    });
  });

  describe('build transfer stake transaction', function () {
    it('should build a transfer stake transaction', async function () {
      builder
        .amount('9007199254740995')
        .destinationColdkey('5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq')
        .hotkey('5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT')
        .originNetuid('12')
        .destinationNetuid('10')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' })
        .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const serializedTx = tx.toBroadcastFormat();

      serializedTx.should.equal(rawTx.transferStake.signed);
      tx.toJson().should.deepEqual({
        id: '0xe5932b507a53d351aabd520487ba55ba833e0968ad18642a28f54dabeb7abf2f',
        sender: '5EGoFA95omzemRssELLDjVenNZ68aXyUeqtKQScXSEBvVJkr',
        referenceBlock: '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
        blockNumber: 3933,
        genesisHash: '0x8f9cf856bf558a14440e75569c9e58594757048d7b3a84b5d25f6bd978263105',
        nonce: 200,
        specVersion: 224,
        transactionVersion: 1,
        eraPeriod: 64,
        chainName: 'Bittensor',
        tip: 0,
        destinationColdkey: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq',
        hotkey: '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT',
        originNetuid: '12',
        destinationNetuid: '10',
        alphaAmount: '9007199254740995',
      });
    });

    it('should re-build from raw signed tx', async function () {
      builder.from(rawTx.transferStake.signed);
      builder.validity({ firstValid: 3933, maxDuration: 64 }).referenceBlock(referenceBlock);
      const tx = await builder.build();
      const serializedTx = tx.toBroadcastFormat();
      serializedTx.should.equal(rawTx.transferStake.signed);
    });
  });
});
