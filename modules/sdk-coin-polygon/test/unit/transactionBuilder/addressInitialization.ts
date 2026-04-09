import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from '../../../src';
import * as testData from '../../resources';
import { getBuilder } from '../../getBuilder';

describe('Eth address initialization', () => {
  it('should fail if there is no contract address', async () => {
    const txBuilder = getBuilder('tpolygon') as TransactionBuilder;
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.fee({
      fee: '10',
      gasLimit: '1000',
    });
    txBuilder.counter(1);
    await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing contract address');
  });

  it('should build properly and return a correct address', async () => {
    const txBuilder = getBuilder('tpolygon') as TransactionBuilder;
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
    should.equal(txJson.deployedAddress, '0xde4133877caa961ff30caf3373c5a2f9e9cd31b2');
    should.equal(txJson.to, testData.FORWARDER_FACTORY_ADDRESS);
  });

  it('should build properly from serialized', async () => {
    const txBuilder = getBuilder('tpolygon') as TransactionBuilder;
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.from(testData.UNSIGNED_ADDRESS_INIT);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();
    should.equal(txJson.to, testData.FORWARDER_FACTORY_ADDRESS);
  });

  it('should build properly from signed serialized', async () => {
    const txBuilder = getBuilder('tpolygon') as TransactionBuilder;
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.from(testData.SIGNED_ADDRESS_INIT);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();
    should.equal(txJson.to, testData.FORWARDER_FACTORY_ADDRESS);
    should.equal(txJson.from, '0xe6c43626f11312de29b0011fa9da71ea3bba0e9f');
  });

  it('should build properly createForwarder call for recovery', async () => {
    const txBuilder = getBuilder('tpolygon') as TransactionBuilder;
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
