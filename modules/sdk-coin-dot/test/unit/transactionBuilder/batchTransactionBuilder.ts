import assert from 'assert';
import should from 'should';
import { spy, assert as SinonAssert } from 'sinon';
import { BatchTransactionBuilder } from '../../../src';
import { ProxyType } from '../../../src/lib/iface';
import utils from '../../../src/lib/utils';
import { accounts, mockTssSignature, rawTx, specVersion, txVersion } from '../../resources';
import { buildTestConfig } from './base';

describe('Dot Batch Transaction Builder', () => {
  let builder: BatchTransactionBuilder;

  describe('setter validation', () => {
    before(function () {
      builder = new BatchTransactionBuilder(buildTestConfig());
    });

    it('should validate list of calls', () => {
      const call = 'invalidUnsignedTransaction';
      const spyValidateCalls = spy(builder, 'validateCalls');
      assert.throws(
        () => builder.calls([call]),
        (e: Error) => e.message === `call in string format must be hex format of a method and its arguments`
      );
      should.doesNotThrow(() => builder.calls(rawTx.pureProxy.batch));
      SinonAssert.calledTwice(spyValidateCalls);
    });
  });

  describe('build batch transaction', function () {
    const sender = accounts.account1;
    const referenceBlock = '0x462ab5246361febb9294ffa41dd099edddec30a205ea15fbd247abb0ddbabd51';
    const genesisHash = '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e';

    beforeEach(() => {
      const config = buildTestConfig();
      builder = new BatchTransactionBuilder(config).material(utils.getMaterial(config));
    });

    describe('signed', function () {
      it('should build a signed batch transaction', async () => {
        builder
          .calls(rawTx.pureProxy.batch)
          .sender({ address: sender.address })
          .validity({ firstValid: 9279281, maxDuration: 64 })
          .referenceBlock(referenceBlock)
          .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 })
          .fee({ amount: 0, type: 'tip' })
          .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.batchCalls.length, rawTx.pureProxy.batch.length);
        should.deepEqual(txJson.batchCalls[0].callIndex, rawTx.pureProxy.batch[0].slice(0, 6));
        should.deepEqual(txJson.batchCalls[0].args?.proxy_type, ProxyType.ANY);
        should.deepEqual(txJson.batchCalls[0].args?.delay, 0);
        should.deepEqual(txJson.batchCalls[0].args?.index, 0);
        should.deepEqual(txJson.batchCalls[1].callIndex, rawTx.pureProxy.batch[0].slice(0, 6));
        should.deepEqual(txJson.batchCalls[1].args?.proxy_type, ProxyType.ANY);
        should.deepEqual(txJson.batchCalls[1].args?.delay, 0);
        should.deepEqual(txJson.batchCalls[1].args?.index, 1);
        should.deepEqual(txJson.sender, sender.address);
        should.deepEqual(txJson.blockNumber, 9279281);
        should.deepEqual(txJson.referenceBlock, referenceBlock);
        should.deepEqual(txJson.genesisHash, genesisHash);
        should.deepEqual(txJson.specVersion, specVersion);
        should.deepEqual(txJson.nonce, 0);
        should.deepEqual(txJson.tip, 0);
        should.deepEqual(txJson.transactionVersion, txVersion);
        should.deepEqual(txJson.chainName, 'Westend');
        should.deepEqual(txJson.eraPeriod, 64);

        const txHex = tx.toBroadcastFormat();
        should.deepEqual(rawTx.batch.twoAddPureProxies.signed, txHex);
      });

      it('should build a signed batch all transaction', async () => {
        builder
          .atomic(true)
          .calls(rawTx.pureProxy.batch)
          .sender({ address: sender.address })
          .validity({ firstValid: 9279281, maxDuration: 64 })
          .referenceBlock(referenceBlock)
          .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 })
          .fee({ amount: 0, type: 'tip' })
          .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.batchCalls.length, rawTx.pureProxy.batch.length);
        should.deepEqual(txJson.batchCalls[0].callIndex, rawTx.pureProxy.batch[0].slice(0, 6));
        should.deepEqual(txJson.batchCalls[0].args?.proxy_type, ProxyType.ANY);
        should.deepEqual(txJson.batchCalls[0].args?.delay, 0);
        should.deepEqual(txJson.batchCalls[0].args?.index, 0);
        should.deepEqual(txJson.batchCalls[1].callIndex, rawTx.pureProxy.batch[0].slice(0, 6));
        should.deepEqual(txJson.batchCalls[1].args?.proxy_type, ProxyType.ANY);
        should.deepEqual(txJson.batchCalls[1].args?.delay, 0);
        should.deepEqual(txJson.batchCalls[1].args?.index, 1);
        should.deepEqual(txJson.sender, sender.address);
        should.deepEqual(txJson.blockNumber, 9279281);
        should.deepEqual(txJson.referenceBlock, referenceBlock);
        should.deepEqual(txJson.genesisHash, genesisHash);
        should.deepEqual(txJson.specVersion, specVersion);
        should.deepEqual(txJson.nonce, 0);
        should.deepEqual(txJson.tip, 0);
        should.deepEqual(txJson.transactionVersion, txVersion);
        should.deepEqual(txJson.chainName, 'Westend');
        should.deepEqual(txJson.eraPeriod, 64);

        const txHex = tx.toBroadcastFormat();
        should.deepEqual(rawTx.batchAll.twoAddPureProxies.signed, txHex);
      });

      it('should build a signed staking batch all transaction', async () => {
        builder
          .atomic(true)
          .calls(rawTx.stake.batchAll.batch)
          .sender({ address: sender.address })
          .validity({ firstValid: 9266787, maxDuration: 64 })
          .referenceBlock(referenceBlock)
          .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 })
          .fee({ amount: 0, type: 'tip' })
          .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.batchCalls.length, rawTx.stake.batchAll.batch.length);
        should.deepEqual(txJson.batchCalls[0].callIndex, rawTx.stake.batchAll.batch[0].slice(0, 6));
        should.deepEqual(txJson.batchCalls[0].args?.value, 500000000000);
        should.deepEqual(txJson.batchCalls[0].args?.payee, { staked: null });
        should.deepEqual(txJson.batchCalls[1].callIndex, rawTx.stake.batchAll.batch[1].slice(0, 6));
        should.deepEqual(txJson.batchCalls[1].args?.delegate, { id: accounts.stakingProxy.address });
        should.deepEqual(txJson.batchCalls[1].args?.proxy_type, ProxyType.STAKING);
        should.deepEqual(txJson.batchCalls[1].args?.delay, 0);
        should.deepEqual(txJson.sender, sender.address);
        should.deepEqual(txJson.blockNumber, 9266787);
        should.deepEqual(txJson.referenceBlock, referenceBlock);
        should.deepEqual(txJson.genesisHash, genesisHash);
        should.deepEqual(txJson.specVersion, specVersion);
        should.deepEqual(txJson.nonce, 0);
        should.deepEqual(txJson.tip, 0);
        should.deepEqual(txJson.transactionVersion, txVersion);
        should.deepEqual(txJson.chainName, 'Westend');
        should.deepEqual(txJson.eraPeriod, 64);

        const txHex = tx.toBroadcastFormat();
        should.deepEqual(rawTx.stake.batchAll.signed, txHex);
      });

      it('should build a signed unstaking batch all transaction', async () => {
        builder
          .atomic(true)
          .calls(rawTx.unstake.batchAll.batch)
          .sender({ address: sender.address })
          .validity({ firstValid: 9266787, maxDuration: 64 })
          .referenceBlock(referenceBlock)
          .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 })
          .fee({ amount: 0, type: 'tip' })
          .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.batchCalls.length, rawTx.unstake.batchAll.batch.length);
        should.deepEqual(txJson.batchCalls[0].callIndex, rawTx.unstake.batchAll.batch[0].slice(0, 6));
        should.deepEqual(txJson.batchCalls[0].args?.delegate, { id: accounts.stakingProxy.address });
        should.deepEqual(txJson.batchCalls[0].args?.proxy_type, ProxyType.STAKING);
        should.deepEqual(txJson.batchCalls[0].args?.delay, 0);
        should.deepEqual(txJson.batchCalls[1].callIndex, rawTx.unstake.batchAll.batch[1].slice(0, 6));
        should.deepEqual(txJson.batchCalls[1].args, {});
        should.deepEqual(txJson.batchCalls[2].callIndex, rawTx.unstake.batchAll.batch[2].slice(0, 6));
        should.deepEqual(txJson.batchCalls[2].args?.value, 500000000000);
        should.deepEqual(txJson.sender, sender.address);
        should.deepEqual(txJson.blockNumber, 9266787);
        should.deepEqual(txJson.referenceBlock, referenceBlock);
        should.deepEqual(txJson.genesisHash, genesisHash);
        should.deepEqual(txJson.specVersion, specVersion);
        should.deepEqual(txJson.nonce, 0);
        should.deepEqual(txJson.tip, 0);
        should.deepEqual(txJson.transactionVersion, txVersion);
        should.deepEqual(txJson.chainName, 'Westend');
        should.deepEqual(txJson.eraPeriod, 64);

        const txHex = tx.toBroadcastFormat();
        should.deepEqual(rawTx.unstake.batchAll.signed, txHex);
      });

      describe('from raw', () => {
        it('should build a batch from a raw signed tx', async () => {
          builder.from(rawTx.batch.threeAddPureProxies.signed);
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
          should.deepEqual(txJson.genesisHash, genesisHash);
          should.deepEqual(txJson.specVersion, specVersion);
          should.deepEqual(txJson.nonce, 0);
          should.deepEqual(txJson.tip, 0);
          should.deepEqual(txJson.transactionVersion, txVersion);
          should.deepEqual(txJson.chainName, 'Westend');
          should.deepEqual(txJson.eraPeriod, 64);

          const txHex = tx.toBroadcastFormat();
          should.deepEqual(rawTx.batch.threeAddPureProxies.signed, txHex);
        });

        it('should build a batch all from a raw signed tx', async () => {
          builder.from(rawTx.batchAll.twoAddPureProxies.signed);
          builder.validity({ firstValid: 9279281, maxDuration: 64 }).referenceBlock(referenceBlock);
          const tx = await builder.build();
          const txJson = tx.toJson();
          // test the call items
          should.deepEqual(txJson.sender, sender.address);
          should.deepEqual(txJson.batchCalls.length, 2);
          should.deepEqual(txJson.batchCalls[0].args?.proxy_type, ProxyType.ANY);
          should.deepEqual(txJson.batchCalls[0].args?.delay, 0);
          should.deepEqual(txJson.batchCalls[0].args?.index, 0);
          should.deepEqual(txJson.batchCalls[1].args?.proxy_type, ProxyType.ANY);
          should.deepEqual(txJson.batchCalls[1].args?.delay, 0);
          should.deepEqual(txJson.batchCalls[1].args?.index, 1);
          should.deepEqual(txJson.blockNumber, 9279281);
          should.deepEqual(txJson.referenceBlock, referenceBlock);
          should.deepEqual(txJson.genesisHash, genesisHash);
          should.deepEqual(txJson.specVersion, specVersion);
          should.deepEqual(txJson.nonce, 0);
          should.deepEqual(txJson.tip, 0);
          should.deepEqual(txJson.transactionVersion, txVersion);
          should.deepEqual(txJson.chainName, 'Westend');
          should.deepEqual(txJson.eraPeriod, 64);

          const txHex = tx.toBroadcastFormat();
          should.deepEqual(rawTx.batchAll.twoAddPureProxies.signed, txHex);
        });

        it('should build a batch all from a raw signed staking tx', async () => {
          builder.from(rawTx.stake.batchAll.signed);
          builder.validity({ firstValid: 9266787, maxDuration: 64 }).referenceBlock(referenceBlock);
          const tx = await builder.build();
          const txJson = tx.toJson();

          // test the call items
          should.deepEqual(txJson.sender, sender.address);
          should.deepEqual(txJson.batchCalls.length, rawTx.stake.batchAll.batch.length);
          should.deepEqual(txJson.batchCalls[0].callIndex, rawTx.stake.batchAll.batch[0].slice(0, 6));
          should.deepEqual(txJson.batchCalls[0].args?.value, 500000000000);
          should.deepEqual(txJson.batchCalls[0].args?.payee, { staked: null });
          should.deepEqual(txJson.batchCalls[1].callIndex, rawTx.stake.batchAll.batch[1].slice(0, 6));
          should.deepEqual(txJson.batchCalls[1].args?.delegate, { id: accounts.stakingProxy.address });
          should.deepEqual(txJson.batchCalls[1].args?.proxy_type, ProxyType.STAKING);
          should.deepEqual(txJson.batchCalls[1].args?.delay, 0);
          should.deepEqual(txJson.blockNumber, 9266787);
          should.deepEqual(txJson.referenceBlock, referenceBlock);
          should.deepEqual(txJson.genesisHash, genesisHash);
          should.deepEqual(txJson.specVersion, specVersion);
          should.deepEqual(txJson.nonce, 0);
          should.deepEqual(txJson.tip, 0);
          should.deepEqual(txJson.transactionVersion, txVersion);
          should.deepEqual(txJson.chainName, 'Westend');
          should.deepEqual(txJson.eraPeriod, 64);

          const txHex = tx.toBroadcastFormat();
          should.deepEqual(rawTx.stake.batchAll.signed, txHex);
        });

        it('should build a batch all from a raw signed unstaking tx', async () => {
          builder.from(rawTx.unstake.batchAll.signed);
          builder.validity({ firstValid: 9266787, maxDuration: 64 }).referenceBlock(referenceBlock);

          const tx = await builder.build();
          const txJson = tx.toJson();

          // test the call items
          should.deepEqual(txJson.sender, sender.address);
          should.deepEqual(txJson.batchCalls.length, rawTx.unstake.batchAll.batch.length);
          should.deepEqual(txJson.batchCalls[0].callIndex, rawTx.unstake.batchAll.batch[0].slice(0, 6));
          should.deepEqual(txJson.batchCalls[0].args?.delegate, { id: accounts.stakingProxy.address });
          should.deepEqual(txJson.batchCalls[0].args?.proxy_type, ProxyType.STAKING);
          should.deepEqual(txJson.batchCalls[0].args?.delay, 0);
          should.deepEqual(txJson.batchCalls[1].callIndex, rawTx.unstake.batchAll.batch[1].slice(0, 6));
          should.deepEqual(txJson.batchCalls[1].args, {});
          should.deepEqual(txJson.batchCalls[2].callIndex, rawTx.unstake.batchAll.batch[2].slice(0, 6));
          should.deepEqual(txJson.batchCalls[2].args?.value, 500000000000);
          should.deepEqual(txJson.blockNumber, 9266787);
          should.deepEqual(txJson.referenceBlock, referenceBlock);
          should.deepEqual(txJson.genesisHash, genesisHash);
          should.deepEqual(txJson.specVersion, specVersion);
          should.deepEqual(txJson.nonce, 0);
          should.deepEqual(txJson.tip, 0);
          should.deepEqual(txJson.transactionVersion, txVersion);
          should.deepEqual(txJson.chainName, 'Westend');
          should.deepEqual(txJson.eraPeriod, 64);

          const txHex = tx.toBroadcastFormat();
          should.deepEqual(rawTx.unstake.batchAll.signed, txHex);
        });
      });
    });

    describe('unsigned', function () {
      it('should build an unsigned batch transaction', async () => {
        builder
          .calls(rawTx.pureProxy.batch)
          .sender({ address: sender.address })
          .validity({ firstValid: 9266787, maxDuration: 64 })
          .referenceBlock(referenceBlock)
          .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
          .fee({ amount: 0, type: 'tip' });

        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.batchCalls.length, rawTx.pureProxy.batch.length);
        should.deepEqual(txJson.batchCalls[0].callIndex, rawTx.pureProxy.batch[0].slice(0, 6));
        should.deepEqual(txJson.batchCalls[0].args?.proxy_type, ProxyType.ANY);
        should.deepEqual(txJson.batchCalls[0].args?.delay, 0);
        should.deepEqual(txJson.batchCalls[0].args?.index, 0);
        should.deepEqual(txJson.batchCalls[1].callIndex, rawTx.pureProxy.batch[0].slice(0, 6));
        should.deepEqual(txJson.batchCalls[1].args?.proxy_type, ProxyType.ANY);
        should.deepEqual(txJson.batchCalls[1].args?.delay, 0);
        should.deepEqual(txJson.batchCalls[1].args?.index, 1);
        should.deepEqual(txJson.sender, sender.address);
        should.deepEqual(txJson.blockNumber, 9266787);
        should.deepEqual(txJson.referenceBlock, referenceBlock);
        should.deepEqual(txJson.genesisHash, genesisHash);
        should.deepEqual(txJson.specVersion, specVersion);
        should.deepEqual(txJson.nonce, 200);
        should.deepEqual(txJson.tip, 0);
        should.deepEqual(txJson.transactionVersion, txVersion);
        should.deepEqual(txJson.chainName, 'Westend');
        should.deepEqual(txJson.eraPeriod, 64);

        const txHex = tx.toBroadcastFormat();
        should.deepEqual(rawTx.batch.twoAddPureProxies.unsigned, txHex);
      });

      it('should build an unsigned batch all transaction', async () => {
        builder
          .atomic(true)
          .calls(rawTx.pureProxy.batch)
          .sender({ address: sender.address })
          .validity({ firstValid: 9266787, maxDuration: 64 })
          .referenceBlock(referenceBlock)
          .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
          .fee({ amount: 0, type: 'tip' });

        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.batchCalls.length, rawTx.pureProxy.batch.length);
        should.deepEqual(txJson.batchCalls[0].callIndex, rawTx.pureProxy.batch[0].slice(0, 6));
        should.deepEqual(txJson.batchCalls[0].args?.proxy_type, ProxyType.ANY);
        should.deepEqual(txJson.batchCalls[0].args?.delay, 0);
        should.deepEqual(txJson.batchCalls[0].args?.index, 0);
        should.deepEqual(txJson.batchCalls[1].callIndex, rawTx.pureProxy.batch[0].slice(0, 6));
        should.deepEqual(txJson.batchCalls[1].args?.proxy_type, ProxyType.ANY);
        should.deepEqual(txJson.batchCalls[1].args?.delay, 0);
        should.deepEqual(txJson.batchCalls[1].args?.index, 1);
        should.deepEqual(txJson.sender, sender.address);
        should.deepEqual(txJson.blockNumber, 9266787);
        should.deepEqual(txJson.referenceBlock, referenceBlock);
        should.deepEqual(txJson.genesisHash, genesisHash);
        should.deepEqual(txJson.specVersion, specVersion);
        should.deepEqual(txJson.nonce, 200);
        should.deepEqual(txJson.tip, 0);
        should.deepEqual(txJson.transactionVersion, txVersion);
        should.deepEqual(txJson.chainName, 'Westend');
        should.deepEqual(txJson.eraPeriod, 64);

        const txHex = tx.toBroadcastFormat();
        should.deepEqual(rawTx.batchAll.twoAddPureProxies.unsigned, txHex);
      });

      it('should build an unsigned staking batch all transaction', async () => {
        builder
          .atomic(true)
          .calls(rawTx.stake.batchAll.batch)
          .sender({ address: sender.address })
          .validity({ firstValid: 9266787, maxDuration: 64 })
          .referenceBlock(referenceBlock)
          .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 })
          .fee({ amount: 0, type: 'tip' });

        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.batchCalls.length, rawTx.stake.batchAll.batch.length);
        should.deepEqual(txJson.batchCalls[0].callIndex, rawTx.stake.batchAll.batch[0].slice(0, 6));
        should.deepEqual(txJson.batchCalls[0].args?.value, 500000000000);
        should.deepEqual(txJson.batchCalls[0].args?.payee, { staked: null });
        should.deepEqual(txJson.batchCalls[1].callIndex, rawTx.stake.batchAll.batch[1].slice(0, 6));
        should.deepEqual(txJson.batchCalls[1].args?.delegate, { id: accounts.stakingProxy.address });
        should.deepEqual(txJson.batchCalls[1].args?.proxy_type, ProxyType.STAKING);
        should.deepEqual(txJson.batchCalls[1].args?.delay, 0);
        should.deepEqual(txJson.sender, sender.address);
        should.deepEqual(txJson.blockNumber, 9266787);
        should.deepEqual(txJson.referenceBlock, referenceBlock);
        should.deepEqual(txJson.genesisHash, genesisHash);
        should.deepEqual(txJson.specVersion, specVersion);
        should.deepEqual(txJson.nonce, 0);
        should.deepEqual(txJson.tip, 0);
        should.deepEqual(txJson.transactionVersion, txVersion);
        should.deepEqual(txJson.chainName, 'Westend');
        should.deepEqual(txJson.eraPeriod, 64);

        const txHex = tx.toBroadcastFormat();
        should.deepEqual(rawTx.stake.batchAll.unsigned, txHex);
      });

      it('should build an unsigned unstaking batch all transaction', async () => {
        builder
          .atomic(true)
          .calls(rawTx.unstake.batchAll.batch)
          .sender({ address: sender.address })
          .validity({ firstValid: 9266787, maxDuration: 64 })
          .referenceBlock(referenceBlock)
          .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 })
          .fee({ amount: 0, type: 'tip' });

        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.batchCalls.length, rawTx.unstake.batchAll.batch.length);
        should.deepEqual(txJson.batchCalls[0].callIndex, rawTx.unstake.batchAll.batch[0].slice(0, 6));
        should.deepEqual(txJson.batchCalls[0].args?.delegate, { id: accounts.stakingProxy.address });
        should.deepEqual(txJson.batchCalls[0].args?.proxy_type, ProxyType.STAKING);
        should.deepEqual(txJson.batchCalls[0].args?.delay, 0);
        should.deepEqual(txJson.batchCalls[1].callIndex, rawTx.unstake.batchAll.batch[1].slice(0, 6));
        should.deepEqual(txJson.batchCalls[1].args, {});
        should.deepEqual(txJson.batchCalls[2].callIndex, rawTx.unstake.batchAll.batch[2].slice(0, 6));
        should.deepEqual(txJson.batchCalls[2].args?.value, 500000000000);
        should.deepEqual(txJson.sender, sender.address);
        should.deepEqual(txJson.blockNumber, 9266787);
        should.deepEqual(txJson.referenceBlock, referenceBlock);
        should.deepEqual(txJson.genesisHash, genesisHash);
        should.deepEqual(txJson.specVersion, specVersion);
        should.deepEqual(txJson.nonce, 0);
        should.deepEqual(txJson.tip, 0);
        should.deepEqual(txJson.transactionVersion, txVersion);
        should.deepEqual(txJson.chainName, 'Westend');
        should.deepEqual(txJson.eraPeriod, 64);

        const txHex = tx.toBroadcastFormat();
        should.deepEqual(rawTx.unstake.batchAll.unsigned, txHex);
      });

      describe('from raw', () => {
        it('should build a batch from a raw unsigned tx', async () => {
          builder.from(rawTx.batch.threeAddPureProxies.unsigned);
          builder
            .validity({ firstValid: 9266787, maxDuration: 64 })
            .referenceBlock(referenceBlock)
            .sender({ address: sender.address });

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
          should.deepEqual(txJson.genesisHash, genesisHash);
          should.deepEqual(txJson.specVersion, specVersion);
          should.deepEqual(txJson.nonce, 0);
          should.deepEqual(txJson.tip, 0);
          should.deepEqual(txJson.transactionVersion, txVersion);
          should.deepEqual(txJson.chainName, 'Westend');
          should.deepEqual(txJson.eraPeriod, 64);

          const txHex = tx.toBroadcastFormat();
          should.deepEqual(rawTx.batch.threeAddPureProxies.unsigned, txHex);
        });

        it('should build a batch all from a raw unsigned tx', async () => {
          builder.from(rawTx.batchAll.twoAddPureProxies.unsigned);
          builder
            .validity({ firstValid: 9266787, maxDuration: 64 })
            .referenceBlock(referenceBlock)
            .sender({ address: sender.address });

          const tx = await builder.build();
          const txJson = tx.toJson();
          should.deepEqual(txJson.sender, sender.address);
          should.deepEqual(txJson.batchCalls.length, 2);
          should.deepEqual(txJson.batchCalls[0].args?.proxy_type, ProxyType.ANY);
          should.deepEqual(txJson.batchCalls[0].args?.delay, 0);
          should.deepEqual(txJson.batchCalls[0].args?.index, 0);
          should.deepEqual(txJson.batchCalls[1].args?.proxy_type, ProxyType.ANY);
          should.deepEqual(txJson.batchCalls[1].args?.delay, 0);
          should.deepEqual(txJson.batchCalls[1].args?.index, 1);
          should.deepEqual(txJson.blockNumber, 9266787);
          should.deepEqual(txJson.referenceBlock, referenceBlock);
          should.deepEqual(txJson.genesisHash, genesisHash);
          should.deepEqual(txJson.specVersion, specVersion);
          should.deepEqual(txJson.nonce, 200);
          should.deepEqual(txJson.tip, 0);
          should.deepEqual(txJson.transactionVersion, txVersion);
          should.deepEqual(txJson.chainName, 'Westend');
          should.deepEqual(txJson.eraPeriod, 64);

          const txHex = tx.toBroadcastFormat();
          should.deepEqual(rawTx.batchAll.twoAddPureProxies.unsigned, txHex);
        });

        it('should build a batch all from a raw unsigned staking tx', async () => {
          builder.from(rawTx.stake.batchAll.unsigned);
          builder
            .validity({ firstValid: 9266787, maxDuration: 64 })
            .referenceBlock(referenceBlock)
            .sender({ address: sender.address });

          const tx = await builder.build();
          const txJson = tx.toJson();

          // test the call items
          should.deepEqual(txJson.sender, sender.address);
          should.deepEqual(txJson.batchCalls.length, rawTx.stake.batchAll.batch.length);
          should.deepEqual(txJson.batchCalls[0].callIndex, rawTx.stake.batchAll.batch[0].slice(0, 6));
          should.deepEqual(txJson.batchCalls[0].args?.value, 500000000000);
          should.deepEqual(txJson.batchCalls[0].args?.payee, { staked: null });
          should.deepEqual(txJson.batchCalls[1].callIndex, rawTx.stake.batchAll.batch[1].slice(0, 6));
          should.deepEqual(txJson.batchCalls[1].args?.delegate, { id: accounts.stakingProxy.address });
          should.deepEqual(txJson.batchCalls[1].args?.proxy_type, ProxyType.STAKING);
          should.deepEqual(txJson.batchCalls[1].args?.delay, 0);
          should.deepEqual(txJson.blockNumber, 9266787);
          should.deepEqual(txJson.referenceBlock, referenceBlock);
          should.deepEqual(txJson.genesisHash, genesisHash);
          should.deepEqual(txJson.specVersion, specVersion);
          should.deepEqual(txJson.nonce, 0);
          should.deepEqual(txJson.tip, 0);
          should.deepEqual(txJson.transactionVersion, txVersion);
          should.deepEqual(txJson.chainName, 'Westend');
          should.deepEqual(txJson.eraPeriod, 64);

          const txHex = tx.toBroadcastFormat();
          should.deepEqual(rawTx.stake.batchAll.unsigned, txHex);
        });

        it('should build a batch all from a raw unsigned unstaking tx', async () => {
          builder.from(rawTx.unstake.batchAll.unsigned);
          builder
            .validity({ firstValid: 9266787, maxDuration: 64 })
            .referenceBlock(referenceBlock)
            .sender({ address: sender.address });

          const tx = await builder.build();
          const txJson = tx.toJson();

          // test the call items
          should.deepEqual(txJson.sender, sender.address);
          should.deepEqual(txJson.batchCalls.length, rawTx.unstake.batchAll.batch.length);
          should.deepEqual(txJson.batchCalls[0].callIndex, rawTx.unstake.batchAll.batch[0].slice(0, 6));
          should.deepEqual(txJson.batchCalls[0].args?.delegate, { id: accounts.stakingProxy.address });
          should.deepEqual(txJson.batchCalls[0].args?.proxy_type, ProxyType.STAKING);
          should.deepEqual(txJson.batchCalls[0].args?.delay, 0);
          should.deepEqual(txJson.batchCalls[1].callIndex, rawTx.unstake.batchAll.batch[1].slice(0, 6));
          should.deepEqual(txJson.batchCalls[1].args, {});
          should.deepEqual(txJson.batchCalls[2].callIndex, rawTx.unstake.batchAll.batch[2].slice(0, 6));
          should.deepEqual(txJson.batchCalls[2].args?.value, 500000000000);
          should.deepEqual(txJson.blockNumber, 9266787);
          should.deepEqual(txJson.referenceBlock, referenceBlock);
          should.deepEqual(txJson.genesisHash, genesisHash);
          should.deepEqual(txJson.specVersion, specVersion);
          should.deepEqual(txJson.nonce, 0);
          should.deepEqual(txJson.tip, 0);
          should.deepEqual(txJson.transactionVersion, txVersion);
          should.deepEqual(txJson.chainName, 'Westend');
          should.deepEqual(txJson.eraPeriod, 64);

          const txHex = tx.toBroadcastFormat();
          should.deepEqual(rawTx.unstake.batchAll.unsigned, txHex);
        });
      });
    });
  });
});
