import should from 'should';
import { spy, assert } from 'sinon';
import { BatchTransactionBuilder } from '../../../../../src/coin/dot';
import { accounts, mockTssSignature, rawTx, specVersion, txVersion } from '../../../../resources/dot';
import { buildTestConfig } from './base';
import { ProxyType } from '../../../../../src/coin/dot/iface';
import utils from '../../../../../src/coin/dot/utils';

describe('Dot Batch Transaction Builder', () => {
  let builder: BatchTransactionBuilder;

  describe('setter validation', () => {
    before(function () {
      builder = new BatchTransactionBuilder(buildTestConfig());
    });

    it('should validate list of calls', () => {
      const call = 'invalidUnsignedTransaction';
      const spyValidateCalls = spy(builder, 'validateCalls');
      should.throws(
        () => builder.calls([call]),
        (e: Error) => e.message === `call in string format must be hex format of a method and its arguments`,
      );
      should.doesNotThrow(() => builder.calls(rawTx.anonymous.batch));
      assert.calledTwice(spyValidateCalls);
    });
  });

  describe('build batch transaction', function () {
    const sender = accounts.account1;
    const referenceBlock = '0x462ab5246361febb9294ffa41dd099edddec30a205ea15fbd247abb0ddbabd51';

    beforeEach(() => {
      const config = buildTestConfig();
      builder = new BatchTransactionBuilder(config).material(utils.getMaterial(config));
    });

    it('should build a batch transaction', async () => {
      builder
        .calls(rawTx.anonymous.batch)
        .sender({ address: sender.address })
        .validity({ firstValid: 9279281, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 })
        .fee({ amount: 0, type: 'tip' })
        .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.batchCalls.length, rawTx.anonymous.batch.length);
      should.deepEqual(txJson.batchCalls[0].callIndex, rawTx.anonymous.batch[0].slice(0, 6));
      should.deepEqual(txJson.batchCalls[0].args?.proxy_type, ProxyType.ANY);
      should.deepEqual(txJson.batchCalls[0].args?.delay, 0);
      should.deepEqual(txJson.batchCalls[0].args?.index, 0);
      should.deepEqual(txJson.batchCalls[1].callIndex, rawTx.anonymous.batch[0].slice(0, 6));
      should.deepEqual(txJson.batchCalls[1].args?.proxy_type, ProxyType.ANY);
      should.deepEqual(txJson.batchCalls[1].args?.delay, 0);
      should.deepEqual(txJson.batchCalls[1].args?.index, 1);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 9279281);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e');
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 0);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'Westend');
      should.deepEqual(txJson.eraPeriod, 64);
    });
    it('should build an unsigned batch transaction', async () => {
      builder
        .calls(rawTx.anonymous.batch)
        .sender({ address: sender.address })
        .validity({ firstValid: 9266787, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.batchCalls.length, rawTx.anonymous.batch.length);
      should.deepEqual(txJson.batchCalls[0].callIndex, rawTx.anonymous.batch[0].slice(0, 6));
      should.deepEqual(txJson.batchCalls[0].args?.proxy_type, ProxyType.ANY);
      should.deepEqual(txJson.batchCalls[0].args?.delay, 0);
      should.deepEqual(txJson.batchCalls[0].args?.index, 0);
      should.deepEqual(txJson.batchCalls[1].callIndex, rawTx.anonymous.batch[0].slice(0, 6));
      should.deepEqual(txJson.batchCalls[1].args?.proxy_type, ProxyType.ANY);
      should.deepEqual(txJson.batchCalls[1].args?.delay, 0);
      should.deepEqual(txJson.batchCalls[1].args?.index, 1);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 9266787);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e');
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'Westend');
      should.deepEqual(txJson.eraPeriod, 64);
    });
    it('should build from raw signed tx', async () => {
      builder.from(rawTx.batch.signed);
      builder.validity({ firstValid: 9266787, maxDuration: 64 }).referenceBlock(referenceBlock);
      const tx = await builder.build();
      const txJson = tx.toJson();
      // test the call items
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.batchCalls.length, 3);
      should.deepEqual(txJson.batchCalls[0].args?.proxy_type, ProxyType.ANY);
      should.deepEqual(txJson.batchCalls[0].args?.delay, 0);
      should.deepEqual(txJson.batchCalls[0].args?.index, 0);
      should.deepEqual(txJson.batchCalls[1].args?.proxy_type, ProxyType.ANY);
      should.deepEqual(txJson.batchCalls[1].args?.delay, 0);
      should.deepEqual(txJson.batchCalls[1].args?.index, 1);
      should.deepEqual(txJson.batchCalls[2].args?.proxy_type, ProxyType.ANY);
      should.deepEqual(txJson.batchCalls[2].args?.delay, 0);
      should.deepEqual(txJson.batchCalls[2].args?.index, 2);
      should.deepEqual(txJson.blockNumber, 9266787);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e');
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 0);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'Westend');
      should.deepEqual(txJson.eraPeriod, 64);
    });
    it('should build from raw unsigned tx', async () => {
      builder.from(rawTx.batch.unsigned);
      builder
        .validity({ firstValid: 9266787, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sender({ address: sender.address })
        .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.batchCalls.length, 3);
      should.deepEqual(txJson.batchCalls[0].args?.proxy_type, ProxyType.ANY);
      should.deepEqual(txJson.batchCalls[0].args?.delay, 0);
      should.deepEqual(txJson.batchCalls[0].args?.index, 0);
      should.deepEqual(txJson.batchCalls[1].args?.proxy_type, ProxyType.ANY);
      should.deepEqual(txJson.batchCalls[1].args?.delay, 0);
      should.deepEqual(txJson.batchCalls[1].args?.index, 1);
      should.deepEqual(txJson.batchCalls[2].args?.proxy_type, ProxyType.ANY);
      should.deepEqual(txJson.batchCalls[2].args?.delay, 0);
      should.deepEqual(txJson.batchCalls[2].args?.index, 2);
      should.deepEqual(txJson.blockNumber, 9266787);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e');
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 0);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'Westend');
      should.deepEqual(txJson.eraPeriod, 64);
    });
  });
});
