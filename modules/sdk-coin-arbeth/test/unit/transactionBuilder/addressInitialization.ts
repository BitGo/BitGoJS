import { TransactionBuilder } from '../../../src';
import * as testData from '../../resources';
import { getBuilder } from '../../getBuilder';
import {
  testAddressInitializationBuildsCorrectlyAndReturnsAddress,
  testAddressInitializationBuildsFromSerializedData,
  testAddressInitializationBuildsFromSignedSerializedData,
  testAddressInitializationWithoutContractAddress,
  testContractCallForCreateForwarder,
  testFailsWithInvalidForwarderVersion,
} from '@bitgo/abstract-eth';

describe('Arbeth address initialization', () => {
  const coin = testData.COIN;
  it('should fail if there is no contract address', async () => {
    const txBuilder = getBuilder(coin) as TransactionBuilder;
    await testAddressInitializationWithoutContractAddress(txBuilder);
  });

  it('should fail if forwarder version is invalid', async () => {
    const txBuilder = getBuilder(coin) as TransactionBuilder;
    await testFailsWithInvalidForwarderVersion(txBuilder, testData);
  });

  it('should build properly and return a correct address', async () => {
    const txBuilder = getBuilder(coin) as TransactionBuilder;
    await testAddressInitializationBuildsCorrectlyAndReturnsAddress(txBuilder, testData);
  });

  it('should build properly from serialized', async () => {
    const txBuilder = getBuilder(coin) as TransactionBuilder;
    await testAddressInitializationBuildsFromSerializedData(txBuilder, testData);
  });

  it('should build properly from signed serialized', async () => {
    const txBuilder = getBuilder(coin) as TransactionBuilder;
    await testAddressInitializationBuildsFromSignedSerializedData(txBuilder, testData);
  });

  it('should build properly createForwarder call for recovery', async () => {
    const txBuilder = getBuilder(coin) as TransactionBuilder;
    await testContractCallForCreateForwarder(txBuilder, testData);
  });
});
