import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { getBuilder } from '../getBuilder';
import { TransactionBuilder } from '../../../src';
import * as testData from '../../resources/celo';

describe('An address initialization', () => {
  describe('Should sign and build', () => {
    it('an address initialization transaction', async () => {
      const txBuilder = getBuilder('tcelo') as TransactionBuilder;
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '12100000',
      });
      txBuilder.counter(2);
      txBuilder.type(TransactionType.AddressInitialization);
      txBuilder.contractCounter(1);
      txBuilder.contract(testData.CONTRACT_ADDRESS);
      txBuilder.sign({ key: testData.KEYPAIR_PRV.getKeys().prv });
      const tx = await txBuilder.build();
      tx.type.should.equal(TransactionType.AddressInitialization);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('12100000');
      txJson.gasPrice.should.equal('1000000000');
      should.equal(txJson.nonce, 2);
      should.equal(txJson.chainId, 44787);
      should.equal(txJson.from, testData.KEYPAIR_PRV.getAddress());
      should.equal(tx.toBroadcastFormat(), testData.TX_ADDRESS_INIT);
      should.equal(txJson.deployedAddress, '0x016e4eee27f3f355bbb78d0e5eb813c4761822c9');
    });
  });

  describe('Should build without sign', () => {
    it('an address initialization transaction without from', async () => {
      const txBuilder = getBuilder('celo') as TransactionBuilder;
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '12100000',
      });
      txBuilder.counter(2);
      txBuilder.type(TransactionType.AddressInitialization);
      txBuilder.contractCounter(1);
      txBuilder.contract(testData.CONTRACT_ADDRESS);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.from, undefined);
    });

    it('an address initialization transaction without contract counter', async () => {
      const txBuilder = getBuilder('tcelo') as TransactionBuilder;
      txBuilder.type(TransactionType.AddressInitialization);
      txBuilder.fee({
        fee: '10000000000',
        gasLimit: '2000000',
      });
      txBuilder.counter(1);
      txBuilder.contract(testData.CONTRACT_ADDRESS);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.from, undefined);
    });
  });

  describe('Should fail to build', () => {
    it('an address initialization transaction without fee', async () => {
      const txBuilder = getBuilder('tcelo') as TransactionBuilder;
      txBuilder.type(TransactionType.AddressInitialization);
      txBuilder.counter(1);
      txBuilder.contract(testData.CONTRACT_ADDRESS);
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing fee');
    });
  });
});
