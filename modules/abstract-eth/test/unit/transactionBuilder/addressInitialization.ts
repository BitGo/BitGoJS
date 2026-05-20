import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from '../../../src';

export async function testAddressInitializationWithoutContractAddress(txBuilder: TransactionBuilder) {
  it('should fail if there is no contract address', async () => {
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.fee({
      fee: '10',
      gasLimit: '1000',
    });
    txBuilder.counter(1);
    await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing contract address');
  });
}

export async function testFailsWithInvalidForwarderVersion(txBuilder: TransactionBuilder, testData: any) {
  it('should fail if forwarder version is invalid', async () => {
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
}

export async function testAddressInitializationBuildsCorrectlyAndReturnsAddress(
  txBuilder: TransactionBuilder,
  testData: any
) {
  it('should build properly and return a correct address', async () => {
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
    should.equal(txJson.deployedAddress, testData.DEPLOYED_ADDRESS);
    should.equal(txJson.to, testData.FORWARDER_FACTORY_ADDRESS);
  });
}

export async function testAddressInitializationBuildsFromSerializedData(txBuilder: TransactionBuilder, testData: any) {
  it('should build properly from serialized', async () => {
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.from(testData.UNSIGNED_ADDRESS_INIT);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();
    should.equal(txJson.to, testData.FORWARDER_FACTORY_ADDRESS);
  });
}

export async function testAddressInitializationBuildsFromSignedSerializedData(
  txBuilder: TransactionBuilder,
  testData: any
) {
  it('should build properly from signed serialized', async () => {
    txBuilder.type(TransactionType.AddressInitialization);
    txBuilder.from(testData.SIGNED_ADDRESS_INIT);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();
    should.equal(txJson.to, testData.FORWARDER_FACTORY_ADDRESS);
    should.equal(txJson.from, testData.ACCOUNT_1);
  });
}

export async function testContractCallForCreateForwarder(txBuilder: TransactionBuilder, testData: any) {
  it('should build properly createForwarder call for recovery', async () => {
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
}
