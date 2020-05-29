import should from 'should';
import { TransactionType } from '../../../../../src/coin/baseCoin';
import { getBuilder, Cgld } from '../../../../../src';
import * as testData from '../../../../resources/cgld/cgld';

describe('An address initialization', () => {
  describe('Should sign and build', () => {
    it('an address initialization transaction', async () => {
      const txBuilder = getBuilder('cgld') as Cgld.TransactionBuilder;
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '12100000',
      });
      txBuilder.chainId(44786);
      txBuilder.source(testData.KEYPAIR_PRV.getAddress());
      txBuilder.counter(2);
      txBuilder.type(TransactionType.AddressInitialization);
      txBuilder.contract(testData.CONTRACT_ADDRESS);
      txBuilder.sign({ key: testData.KEYPAIR_PRV.getKeys().prv });
      const tx = await txBuilder.build();
      tx.type.should.equal(TransactionType.AddressInitialization);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('12100000');
      txJson.gasPrice.should.equal('1000000000');
      should.equal(txJson.nonce, 2);
      should.equal(txJson.chainId, 44786);
      should.equal(tx.toBroadcastFormat(), testData.TX_ADDRESS_INIT);
    });
  });

  describe('Should fail to build', () => {
    it('an address initialization transaction without fee', async () => {
      const txBuilder = getBuilder('cgld') as Cgld.TransactionBuilder;
      txBuilder.type(TransactionType.AddressInitialization);
      txBuilder.chainId(44786);
      txBuilder.source(testData.KEYPAIR_PRV.getAddress());
      txBuilder.counter(1);
      txBuilder.contract(testData.CONTRACT_ADDRESS);
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing fee');
    });

    it('an address initialization transaction without source', async () => {
      const txBuilder = getBuilder('cgld') as Cgld.TransactionBuilder;
      txBuilder.type(TransactionType.AddressInitialization);
      txBuilder.fee({
        fee: '10000000000',
        gasLimit: '2000000',
      });
      txBuilder.chainId(44786);
      txBuilder.counter(1);
      txBuilder.contract(testData.CONTRACT_ADDRESS);
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing source');
    });

    it('an address initialization transaction without chain id', async () => {
      const txBuilder = getBuilder('cgld') as Cgld.TransactionBuilder;
      txBuilder.type(TransactionType.AddressInitialization);
      txBuilder.fee({
        fee: '10000000000',
        gasLimit: '2000000',
      });
      txBuilder.source(testData.KEYPAIR_PRV.getAddress());
      txBuilder.counter(1);
      txBuilder.contract(testData.CONTRACT_ADDRESS);
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing chain id');
    });
  });
});
