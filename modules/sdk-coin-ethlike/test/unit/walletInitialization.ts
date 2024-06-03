import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { EthLikeTransactionBuilder } from '../../src';
import * as testData from '../resources';
import { getBuilder } from '../getBuilder';
import { coins } from '@bitgo/statics';

describe('EthLike wallet initialization', function () {
  let txBuilder: EthLikeTransactionBuilder;
  const initTxBuilder = (): void => {
    txBuilder = new EthLikeTransactionBuilder(coins.get('tbaseeth'), testData.baseChainCommon);
    txBuilder.fee({
      fee: '10000000000',
      gasLimit: '6800000',
    });
    txBuilder.counter(1);
    txBuilder.type(TransactionType.WalletInitialization);
    txBuilder.walletVersion(1);
    txBuilder.contract(testData.WALLET_FACTORY_ADDRESS);
    txBuilder.salt('0x0');
  };

  describe('should build', () => {
    it('an init transaction', async () => {
      initTxBuilder();

      txBuilder.owner('0xe6c43626f11312de29b0011fa9da71ea3bba0e9f');
      txBuilder.owner('0x78caeb4527170e52f54d936e4eef6f83250e01bb');
      txBuilder.owner('0xb1938215967408fff7c59c77ae5e5283b55c8e26');
      txBuilder.sign({ key: testData.PRIVATE_KEY_1 });

      const tx = await txBuilder.build();

      tx.type.should.equal(TransactionType.WalletInitialization);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('6800000');
      txJson.gasPrice.should.equal('10000000000');
      should.equal(txJson.nonce, 1);
      should.equal(txJson.chainId, '0x14a34');
      should.equal(tx.toBroadcastFormat(), testData.TX_BROADCAST);
    });

    it('a signed init transaction from serialized', async () => {
      const newTxBuilder = new EthLikeTransactionBuilder(coins.get('tbaseeth'), testData.baseChainCommon);
      newTxBuilder.from(testData.TX_BROADCAST);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toBroadcastFormat(), testData.TX_BROADCAST);
      should.equal(newTx.id, '0x6c2cb55b93bd39f47c1f57aacadce4bb7316775cf03feb86019a205d8c7be9b1');
      const txJson = newTx.toJson();
      should.exist(txJson.v);
      should.exist(txJson.r);
      should.exist(txJson.s);
      should.exist(txJson.from);
    });

    it('a wallet initialization transaction with nonce 0', async () => {
      initTxBuilder();
      txBuilder.counter(0);
      txBuilder.owner('0xe6c43626f11312de29b0011fa9da71ea3bba0e9f');
      txBuilder.owner('0x78caeb4527170e52f54d936e4eef6f83250e01bb');
      txBuilder.owner('0xb1938215967408fff7c59c77ae5e5283b55c8e26');
      txBuilder.sign({ key: testData.PRIVATE_KEY_1 });
      const tx = await txBuilder.build();

      tx.type.should.equal(TransactionType.WalletInitialization);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('6800000');
      txJson.gasPrice.should.equal('10000000000');
      should.equal(txJson.nonce, 0);
      should.equal(txJson.chainId, '0x14a34');
    });

    it('an unsigned init transaction from serialized with 0-prefixed address', async () => {
      initTxBuilder();
      txBuilder.owner('0xe6c43626f11312de29b0011fa9da71ea3bba0e9f');
      txBuilder.owner('0x78caeb4527170e52f54d936e4eef6f83250e01bb');
      txBuilder.owner('0xb1938215967408fff7c59c77ae5e5283b55c8e26');
      const tx = await txBuilder.build();
      const serialized = tx.toBroadcastFormat();

      const newTxBuilder = new EthLikeTransactionBuilder(coins.get('tbaseeth'), testData.baseChainCommon);
      newTxBuilder.from(serialized);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toBroadcastFormat(), serialized);
    });

    it('an unsigned init transaction from serialized', async () => {
      initTxBuilder();
      txBuilder.owner('0xe6c43626f11312de29b0011fa9da71ea3bba0e9f');
      txBuilder.owner('0x78caeb4527170e52f54d936e4eef6f83250e01bb');
      txBuilder.owner('0xb1938215967408fff7c59c77ae5e5283b55c8e26');
      const tx = await txBuilder.build();
      const serialized = tx.toBroadcastFormat();

      const newTxBuilder = new EthLikeTransactionBuilder(coins.get('tbaseeth'), testData.baseChainCommon);
      newTxBuilder.from(serialized);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toBroadcastFormat(), serialized);
    });

    it('an unsigned transaction with final v check', async () => {
      initTxBuilder();
      txBuilder.owner('0xe6c43626f11312de29b0011fa9da71ea3bba0e9f');
      txBuilder.owner('0x78caeb4527170e52f54d936e4eef6f83250e01bb');
      txBuilder.owner('0xb1938215967408fff7c59c77ae5e5283b55c8e26');
      const tx = await txBuilder.build();
      should.equal(tx.toJson().v, '0x02948b');
    });

    it('wallet deployment transaction for recovery', async () => {
      const txBuilder = getBuilder('tbaseeth', testData.baseChainCommon) as EthLikeTransactionBuilder;
      txBuilder.type(TransactionType.RecoveryWalletDeployment);
      txBuilder.data(testData.RECOVERY_WALLET_BYTE_CODE);
      txBuilder.fee({
        eip1559: {
          maxFeePerGas: '100',
          maxPriorityFeePerGas: '10',
        },
        fee: '100',
        gasLimit: '10000',
      });
      txBuilder.counter(1);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson._type, 'EIP1559');
      should.equal(txJson.gasLimit, '10000');
      should.exists(tx.toBroadcastFormat());
    });

    it('fail when data is not passed recovery', async () => {
      const txBuilder = getBuilder('tbaseeth', testData.baseChainCommon) as EthLikeTransactionBuilder;
      txBuilder.type(TransactionType.RecoveryWalletDeployment);
      txBuilder.fee({
        eip1559: {
          maxFeePerGas: '100',
          maxPriorityFeePerGas: '10',
        },
        fee: '100',
        gasLimit: '10000',
      });
      txBuilder.counter(1);
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing contract call data field');
    });
  });
});
