import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from '../../../src';
import * as testData from '../../resources';
import { getBuilder } from '../../getBuilder';
import {
  testAddressInitializationBuildsFromSerializedData,
  testAddressInitializationBuildsFromSignedSerializedData,
  testAddressInitializationWithoutContractAddress,
  testContractCallForCreateForwarder,
  testFailsWithInvalidForwarderVersion,
} from '@bitgo/abstract-eth';

describe('Polygon address initialization', () => {
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
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.fee({
      fee: '10',
      gasLimit: '1000',
    });
    txBuilder.counter(1);
    txBuilder.contract(testData.FORWARDER_FACTORY_ADDRESS);
    txBuilder.baseAddress(testData.BASE_ADDRESS);
    txBuilder.forwarderVersion(1);
    txBuilder.salt('0x1');
    txBuilder.initCode(testData.FORWARDER_IMPLEMENTATION_ADDRESS);
    txBuilder.sign({ key: testData.KEYPAIR_PRV.getKeys().prv });
    const tx = await txBuilder.build();
    const txJson = tx.toJson();
    should.equal(txJson.deployedAddress, testData.DEPLOYED_ADDRESS);
    should.equal(txJson.to, testData.FORWARDER_FACTORY_ADDRESS);
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
