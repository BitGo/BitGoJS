import assert from 'assert';
import should from 'should';
import { spy, assert as SinonAssert } from 'sinon';
import { UnstakeBuilder } from '../../../src/lib/unstakeBuilder';
import { accounts, mockTssSignature, genesisHash, chainName, rawTx } from '../../resources';
import { buildTestConfig } from './base';
import utils from '../../../src/lib/utils';
import { testnetMaterial } from '../../../src/resources';

describe('Tao Unstake Builder', function () {
  const referenceBlock = '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d';
  let builder: UnstakeBuilder;
  const sender = accounts.account1;

  beforeEach(function () {
    const config = buildTestConfig();
    const material = utils.getMaterial(config.network.type);
    builder = new UnstakeBuilder(config).material(material);
  });

  describe('setter validation', function () {
    it('should validate stake amount', function () {
      const spyValidateValue = spy(builder, 'validateValue');
      assert.throws(
        () => builder.amount('-1'),
        (e: Error) => e.message === 'Value cannot be less than zero'
      );
      should.doesNotThrow(() => builder.amount('1000'));
      SinonAssert.calledTwice(spyValidateValue);
    });
    it('should validate hotkey address', function () {
      const spyValidateAddress = spy(builder, 'validateAddress');
      assert.throws(
        () => builder.hotkey({ address: 'abc' }),
        (e: Error) => e.message === `The address 'abc' is not a well-formed dot address`
      );
      should.doesNotThrow(() => builder.hotkey({ address: '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT' }));
      SinonAssert.calledTwice(spyValidateAddress);
    });
  });

  describe('build unstake transaction', function () {
    it('should build a unstake transaction', async function () {
      builder
        .amount('50000000000000')
        .hotkey({ address: '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT' })
        .netuid('0')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' })
        .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '50000000000000');
      should.deepEqual(txJson.to, '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT');
      should.deepEqual(txJson.netuid, '0');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName.toLowerCase(), chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build an unsigned unstake transaction', async function () {
      builder
        .amount('50000000000000')
        .hotkey({ address: '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT' })
        .netuid('0')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '50000000000000');
      should.deepEqual(txJson.to, '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT');
      should.deepEqual(txJson.netuid, '0');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName.toLowerCase(), chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw signed tx', async function () {
      builder.from(rawTx.unstake.signed);
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
      should.deepEqual(txJson.specVersion, Number(testnetMaterial.specVersion));
      should.deepEqual(txJson.nonce, 361);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, Number(testnetMaterial.txVersion));
      should.deepEqual(txJson.chainName.toLowerCase(), chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });
  });
});
