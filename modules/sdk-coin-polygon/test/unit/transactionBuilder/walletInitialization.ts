import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from '../../../src';
import * as testData from '../../resources';
import { getBuilder } from '../../getBuilder';
import { coins } from '@bitgo/statics';
import {
  testInitTransaction,
  testSignedInitTransaction,
  testWalletInitTransaction,
  testUnsignedInitTransaction,
  testUnsignedInitTransactionFromSerialized,
  testFinalVCheck,
  testRecoveryWalletDeployment,
  testRecoveryTransactionWithoutData,
} from '@bitgo/abstract-eth';

describe('Polygon wallet initialization', function () {
  let txBuilder: TransactionBuilder;
  const coin = testData.COIN;
  const initTxBuilder = (): void => {
    txBuilder = new TransactionBuilder(coins.get(coin));
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
      await testInitTransaction(txBuilder, testData);
    });

    it('a signed init transaction from serialized', async () => {
      const newTxBuilder = new TransactionBuilder(coins.get(coin));
      await testSignedInitTransaction(newTxBuilder, testData);
    });

    it('a wallet initialization transaction with nonce 0', async () => {
      initTxBuilder();
      await testWalletInitTransaction(txBuilder, testData);
    });

    it('an unsigned init transaction from serialized with 0-prefixed address', async () => {
      initTxBuilder();
      const newTxBuilder = new TransactionBuilder(coins.get(coin));
      await testUnsignedInitTransaction(txBuilder, newTxBuilder, testData);
    });

    it('an unsigned init transaction from serialized', async () => {
      initTxBuilder();
      const newTxBuilder = new TransactionBuilder(coins.get(coin));
      await testUnsignedInitTransactionFromSerialized(txBuilder, newTxBuilder, testData);
    });

    it('an unsigned transaction with final v check', async () => {
      initTxBuilder();
      await testFinalVCheck(txBuilder, testData);
    });

    it('wallet deployment transaction for recovery', async () => {
      const txBuilder = getBuilder(coin) as TransactionBuilder;
      await testRecoveryWalletDeployment(txBuilder, testData);
    });

    it('fail when data is not passed recovery', async () => {
      const txBuilder = getBuilder(coin) as TransactionBuilder;
      await testRecoveryTransactionWithoutData(txBuilder);
    });
  });
});
