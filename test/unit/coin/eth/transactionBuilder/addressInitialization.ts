import should from 'should';
import { TransactionType } from '../../../../../src/coin/baseCoin';
import { getBuilder, Eth } from '../../../../../src';
import * as testData from '../../../../resources/eth/eth';

describe('Eth address initialization', () => {
  it('should fail if it is not the proper transaction type', () => {
    const txBuilder = getBuilder('eth') as Eth.TransactionBuilder;
    txBuilder.contract(testData.CONTRACT_ADDRESS);
    txBuilder.contractCounter(1);
    should.throws(() => {
      txBuilder.getForwarderAddress();
    }, 'Wrong transaction type');
  });

  it('should fail if there is no contract address', () => {
    const txBuilder = getBuilder('eth') as Eth.TransactionBuilder;
    txBuilder.type(TransactionType.AddressInitialization);
    should.throws(() => {
      txBuilder.getForwarderAddress();
    }, 'Contract address was not defined');
  });

  it('should fail if there is no contract counter', () => {
    const txBuilder = getBuilder('eth') as Eth.TransactionBuilder;
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.contract(testData.CONTRACT_ADDRESS);
    should.throws(() => {
      txBuilder.getForwarderAddress();
    }, 'Contract nonce was not defined');
  });

  it('should return a correct address', () => {
    const txBuilder = getBuilder('eth') as Eth.TransactionBuilder;
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.contract(testData.CONTRACT_ADDRESS);
    txBuilder.contractCounter(1);
    should.equal(txBuilder.getForwarderAddress(), '0x016e4eee27f3f355bbb78d0e5eb813c4761822c9');
  });

  it('should build properly and return a correct address', async () => {
    const txBuilder = getBuilder('eth') as Eth.TransactionBuilder;
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.fee({
      fee: '10',
      gasLimit: '1000',
    });
    txBuilder.chainId(31);
    txBuilder.source(testData.KEYPAIR_PRV.getAddress());
    txBuilder.counter(1);
    txBuilder.contract(testData.CONTRACT_ADDRESS);
    txBuilder.contractCounter(2);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();
    should.equal(txBuilder.getForwarderAddress(), '0x858c7a9c3bda553f4d0f15e5e33231dd863cb9d4');
    should.equal(txJson.to, testData.CONTRACT_ADDRESS);
  });
});
