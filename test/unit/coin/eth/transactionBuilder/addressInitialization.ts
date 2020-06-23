import should from 'should';
import { TransactionType } from '../../../../../src/coin/baseCoin';
import { getBuilder, Eth } from '../../../../../src';
import * as testData from '../../../../resources/eth/eth';

describe('Eth address initialization', () => {
  it('should fail if there is no contract address', async () => {
    const txBuilder = getBuilder('teth') as Eth.TransactionBuilder;
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.fee({
      fee: '10',
      gasLimit: '1000',
    });
    txBuilder.counter(1);
    await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing contract address');
  });

  it('should fail if there is no contract counter', async () => {
    const txBuilder = getBuilder('teth') as Eth.TransactionBuilder;
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.fee({
      fee: '10',
      gasLimit: '1000',
    });
    txBuilder.counter(1);
    txBuilder.contract(testData.CONTRACT_ADDRESS);
    await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing contract counter');
  });

  it('should build properly and return a correct address', async () => {
    const txBuilder = getBuilder('teth') as Eth.TransactionBuilder;
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.fee({
      fee: '10',
      gasLimit: '1000',
    });
    txBuilder.counter(1);
    txBuilder.contract(testData.CONTRACT_ADDRESS);
    txBuilder.contractCounter(2);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();
    should.equal(txJson.deployedAddress, '0x858c7a9c3bda553f4d0f15e5e33231dd863cb9d4');
    should.equal(txJson.to, testData.CONTRACT_ADDRESS);
  });
});
