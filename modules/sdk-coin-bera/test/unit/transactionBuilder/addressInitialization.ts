import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from '../../../src';
import * as testData from '../../resources';
import { getBuilder } from '../../getBuilder';

describe('Arbeth address initialization', () => {
  it('should fail if there is no contract address', async () => {
    const txBuilder = getBuilder('tbera') as TransactionBuilder;
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.fee({
      fee: '10',
      gasLimit: '1000',
    });
    txBuilder.counter(1);
    await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing contract address');
  });

  it('should fail if forwarder version is invalid', async () => {
    const txBuilder = getBuilder('tbera') as TransactionBuilder;
    try {
      txBuilder.type(TransactionType.AddressInitialization);
      txBuilder.fee({
        fee: '10',
        gasLimit: '1000',
      });
      txBuilder.contract(testData.FORWARDER_FACTORY_ADDRESS);
      txBuilder.forwarderVersion(3);
    } catch (e) {
      should.equal(e.message, 'Invalid forwarder version: 3');
    }
  });

  it('should build properly and return a correct address', async () => {
    const txBuilder = getBuilder('tbera') as TransactionBuilder;
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.fee({
      fee: '10',
      gasLimit: '1000',
    });
    txBuilder.counter(1);
    txBuilder.contract(testData.FORWARDER_FACTORY_ADDRESS);
    txBuilder.baseAddress(testData.BASE_ADDRESS);
    txBuilder.feeAddress(testData.FEE_ADDRESS);
    txBuilder.forwarderVersion(4);
    txBuilder.salt('0x1');
    txBuilder.initCode(testData.FORWARDER_IMPLEMENTATION_ADDRESS);
    txBuilder.sign({ key: testData.KEYPAIR_PRV.getKeys().prv });
    const tx = await txBuilder.build();
    const txJson = tx.toJson();
    should.equal(txJson.deployedAddress, '0xd9d189aa6907a4fafd3c66e8cc178011b1f443f5');
    should.equal(txJson.to, testData.FORWARDER_FACTORY_ADDRESS);
  });

  it('should build properly from serialized', async () => {
    const txBuilder = getBuilder('tbera') as TransactionBuilder;
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.from(testData.UNSIGNED_ADDRESS_INIT);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();
    should.equal(txJson.to, testData.FORWARDER_FACTORY_ADDRESS);
  });

  it('should build properly from signed serialized', async () => {
    const txBuilder = getBuilder('tbera') as TransactionBuilder;
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.from(testData.SIGNED_ADDRESS_INIT);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();
    should.equal(txJson.to, testData.FORWARDER_FACTORY_ADDRESS);
    should.equal(txJson.from, '0xe6c43626f11312de29b0011fa9da71ea3bba0e9f');
  });

  it('should build properly createForwarder call for recovery', async () => {
    const txBuilder = getBuilder('tbera') as TransactionBuilder;
    txBuilder.type(TransactionType.ContractCall);
    txBuilder.contract(testData.BASE_ADDRESS);
    txBuilder.data(testData.CREATE_FORWARDER_METHOD);
    txBuilder.fee({
      fee: '10',
      gasLimit: '1000',
    });
    const tx = await txBuilder.build();
    const txJson = tx.toJson();
    should.equal(txJson.to, testData.BASE_ADDRESS);
  });
});
