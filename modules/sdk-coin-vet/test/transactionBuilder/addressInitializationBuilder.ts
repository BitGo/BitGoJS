import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import * as testData from '../resources/vet';
import { TransactionBuilderFactory, Transaction, AddressInitializationTransaction } from '../../src';

describe('Address Initialisation Transaction', () => {
  const factory = new TransactionBuilderFactory(coins.get('tvet'));
  describe('Succeed', () => {
    it('should build an address initialisation transaction', async function () {
      const transaction = new AddressInitializationTransaction(coins.get('tvet'));
      const txBuilder = factory.getAddressInitializationBuilder(transaction);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);
      txBuilder.contract(testData.FORWARDER_FACTORY_ADDRESS);
      txBuilder.baseAddress(testData.BASE_ADDRESS);
      txBuilder.feeAddress(testData.FEE_ADDRESS);
      txBuilder.initCode(testData.FORWARDER_IMPLEMENTATION_ADDRESS);
      txBuilder.salt(testData.SALT);
      const tx = (await txBuilder.build()) as AddressInitializationTransaction;
      should.equal(tx.gas, 21000);
      should.equal(tx.nonce, '64248');
      should.equal(tx.expiration, 64);
      should.equal(tx.type, TransactionType.AddressInitialization);
      should.equal(tx.blockRef, '0x014ead140e77bbc1');
      should.equal(tx.clauses.length, 1);
      should.equal(tx.clauses[0].to, testData.FORWARDER_FACTORY_ADDRESS);
      should.equal(tx.clauses[0].data, testData.ADDRESS_INITIALIZATION_DATA);
      should.equal(tx.clauses[0].value, '0x0');
      should.equal(tx.deployedAddress, testData.FORWARDER_ADDRESS);
      const rawTx = tx.toBroadcastFormat();
      should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      rawTx.should.equal(testData.ADDRESS_INITIALIZATION_TRANSACTION);
    });

    it('should succeed to validate a valid signablePayload', async function () {
      const transaction = new AddressInitializationTransaction(coins.get('tvet'));
      const txBuilder = factory.getAddressInitializationBuilder(transaction);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);
      txBuilder.contract(testData.FORWARDER_FACTORY_ADDRESS);
      txBuilder.baseAddress(testData.BASE_ADDRESS);
      txBuilder.feeAddress(testData.FEE_ADDRESS);
      txBuilder.initCode(testData.FORWARDER_IMPLEMENTATION_ADDRESS);
      txBuilder.salt(testData.SALT);
      const tx = (await txBuilder.build()) as Transaction;
      const signablePayload = tx.signablePayload;
      should.equal(signablePayload.toString('hex'), testData.ADDRESS_INITIALIZATION_SIGNABLE_PAYLOAD);
    });

    it('should build a unsigned tx and validate its toJson', async function () {
      const transaction = new AddressInitializationTransaction(coins.get('tvet'));
      const txBuilder = factory.getAddressInitializationBuilder(transaction);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);
      txBuilder.contract(testData.FORWARDER_FACTORY_ADDRESS);
      txBuilder.baseAddress(testData.BASE_ADDRESS);
      txBuilder.feeAddress(testData.FEE_ADDRESS);
      txBuilder.initCode(testData.FORWARDER_IMPLEMENTATION_ADDRESS);
      txBuilder.salt(testData.SALT);

      const tx = (await txBuilder.build()) as Transaction;
      const toJson = tx.toJson();
      should.equal(toJson.nonce, '64248');
      should.equal(toJson.gas, 21000);
      should.equal(toJson.gasPriceCoef, 128);
      should.equal(toJson.expiration, 64);
      should.equal(toJson.data, testData.ADDRESS_INITIALIZATION_DATA);
      should.equal(toJson.to, testData.FORWARDER_FACTORY_ADDRESS);
      should.equal(toJson.deployedAddress, testData.FORWARDER_ADDRESS);
      should.equal(toJson.value, '0');
    });

    it('should build properly from serialized', async () => {
      const txBuilder = factory.from(testData.SERIALIZED_SIGNED_ADDRESS_INIT_TX);
      const signedTx = await txBuilder.build();
      const signedtxJson = signedTx.toJson();
      should.equal(signedtxJson.gas, 150000);

      txBuilder.gas(180000);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.to, testData.FORWARDER_FACTORY_ADDRESS);
      should.equal(txJson.gas, 180000);
      console.log('txJson:', txJson);
    });
  });

  describe('Fail', () => {
    it('should fail if invalid params are used to build a tx', async function () {
      const transaction = new AddressInitializationTransaction(coins.get('tvet'));
      const txBuilder = factory.getAddressInitializationBuilder(transaction);

      should(() => txBuilder.baseAddress('randomString')).throwError('Invalid address randomString');
      should(() => txBuilder.contract('randomString')).throwError('Invalid address randomString');
      should(() => txBuilder.feeAddress('randomString')).throwError('Invalid address randomString');
    });
  });
});
