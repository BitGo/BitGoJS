import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from '../../../src';
import * as testData from '../../resources/eth';
import { getBuilder } from '../getBuilder';

describe('Eth address initialization', () => {
  it('should fail if there is no contract address', async () => {
    const txBuilder = getBuilder('teth') as TransactionBuilder;
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.fee({
      fee: '10',
      gasLimit: '1000',
    });
    txBuilder.counter(1);
    await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing contract address');
  });

  it('should not fail if there is no contract counter', async () => {
    const txBuilder = getBuilder('teth') as TransactionBuilder;
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.fee({
      fee: '10',
      gasLimit: '1000',
    });
    txBuilder.counter(1);
    txBuilder.contract(testData.CONTRACT_ADDRESS);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();
    should.equal(txJson.to, testData.CONTRACT_ADDRESS);
  });

  it('should build properly from serialized', async () => {
    const txBuilder = getBuilder('eth') as TransactionBuilder;
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.from(testData.UNSIGNED_ADDRESS_INIT);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();
    should.equal(txJson.to, testData.CONTRACT_ADDRESS);
  });

  it('should build properly from signed serialized', async () => {
    const txBuilder = getBuilder('eth') as TransactionBuilder;
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.from(testData.SIGNED_ADDRESS_INIT);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();
    should.equal(txJson.to, '0x1522900b6dafac587d499a862861c0869be6e428');
    should.equal(txJson.from, '0x00bdb5699745f5b860228c8f939abf1b9ae374ed');
  });

  it('should build properly and return a correct address', async () => {
    const txBuilder = getBuilder('teth') as TransactionBuilder;
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.fee({
      fee: '10',
      gasLimit: '1000',
    });
    txBuilder.counter(1);
    txBuilder.contract(testData.CONTRACT_ADDRESS);
    txBuilder.contractCounter(2);
    txBuilder.sign({ key: testData.KEYPAIR_PRV.getKeys().prv });
    const tx = await txBuilder.build();
    const txJson = tx.toJson();
    should.equal(txJson.deployedAddress, '0x858c7a9c3bda553f4d0f15e5e33231dd863cb9d4');
    should.equal(txJson.to, testData.CONTRACT_ADDRESS);
  });
});
