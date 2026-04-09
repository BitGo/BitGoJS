import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from '../../../src';

function addOwner(txBuilder: TransactionBuilder, testData) {
  txBuilder.owner(testData.ACCOUNT_1);
  txBuilder.owner(testData.ACCOUNT_2);
  txBuilder.owner(testData.ACCOUNT_3);
}

export async function testInitTransaction(txBuilder: TransactionBuilder, testData: any) {
  it('an init transaction', async () => {
    addOwner(txBuilder, testData);
    txBuilder.sign({ key: testData.PRIVATE_KEY_1 });

    const tx = await txBuilder.build();

    tx.type.should.equal(TransactionType.WalletInitialization);
    const txJson = tx.toJson();
    txJson.gasLimit.should.equal('6800000');
    txJson.gasPrice.should.equal('10000000000');
    should.equal(txJson.nonce, 1);
    should.equal(txJson.chainId, testData.TXDATA.chainId);
    should.equal(tx.toBroadcastFormat(), testData.TX_BROADCAST);
  });
}

export async function testWalletInitTransaction(txBuilder: TransactionBuilder, testData: any) {
  it('a wallet initialization transaction with nonce 0', async () => {
    addOwner(txBuilder, testData);
    txBuilder.counter(0);
    txBuilder.sign({ key: testData.PRIVATE_KEY_1 });
    const tx = await txBuilder.build();

    tx.type.should.equal(TransactionType.WalletInitialization);
    const txJson = tx.toJson();
    txJson.gasLimit.should.equal('6800000');
    txJson.gasPrice.should.equal('10000000000');
    should.equal(txJson.nonce, 0);
    should.equal(txJson.chainId, testData.TXDATA.chainId);
  });
}

export async function testSignedInitTransaction(newTxBuilder: TransactionBuilder, testData: any) {
  it('a signed init transaction from serialized', async () => {
    newTxBuilder.from(testData.TX_BROADCAST);
    const newTx = await newTxBuilder.build();
    should.equal(newTx.toBroadcastFormat(), testData.TX_BROADCAST);
    should.equal(newTx.id, testData.EXPECTED_NEW_TX_ID);
    const txJson = newTx.toJson();
    should.exist(txJson.v);
    should.exist(txJson.r);
    should.exist(txJson.s);
    should.exist(txJson.from);
  });
}

export async function testUnsignedInitTransaction(
  txBuilder: TransactionBuilder,
  newTxBuilder: TransactionBuilder,
  testData: any
) {
  it('an unsigned init transaction from serialized with 0-prefixed address', async () => {
    addOwner(txBuilder, testData);
    const tx = await txBuilder.build();
    const serialized = tx.toBroadcastFormat();
    newTxBuilder.from(serialized);
    const newTx = await newTxBuilder.build();
    should.equal(newTx.toBroadcastFormat(), serialized);
  });
}

export async function testUnsignedInitTransactionFromSerialized(
  txBuilder: TransactionBuilder,
  newTxBuilder: TransactionBuilder,
  testData: any
) {
  it('an unsigned init transaction from serialized', async () => {
    addOwner(txBuilder, testData);
    const tx = await txBuilder.build();
    const serialized = tx.toBroadcastFormat();
    newTxBuilder.from(serialized);
    const newTx = await newTxBuilder.build();
    should.equal(newTx.toBroadcastFormat(), serialized);
  });
}

export async function testFinalVCheck(txBuilder: TransactionBuilder, testData: any) {
  it('an unsigned transaction with final v check', async () => {
    addOwner(txBuilder, testData);
    const tx = await txBuilder.build();
    should.equal(tx.toJson().v, testData.FINAL_V);
  });
}

export async function testRecoveryWalletDeployment(txBuilder: TransactionBuilder, testData: any) {
  it('wallet deployment transaction for recovery', async () => {
    txBuilder.type(TransactionType.RecoveryWalletDeployment);
    txBuilder.data(testData.RECOVERY_WALLET_BYTE_CODE);
    txBuilder.fee({
      eip1559: {
        maxFeePerGas: '100',
        maxPriorityFeePerGas: '10',
      },
      fee: '100',
      gasLimit: '10000',
    });
    txBuilder.counter(1);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();
    should.equal(txJson._type, 'EIP1559');
    should.equal(txJson.gasLimit, '10000');
    should.exists(tx.toBroadcastFormat());
  });
}

export async function testRecoveryTransactionWithoutData(txBuilder: TransactionBuilder) {
  it('fail when data is not passed recovery', async () => {
    txBuilder.type(TransactionType.RecoveryWalletDeployment);
    txBuilder.fee({
      eip1559: {
        maxFeePerGas: '100',
        maxPriorityFeePerGas: '10',
      },
      fee: '100',
      gasLimit: '10000',
    });
    txBuilder.counter(1);
    await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing contract call data field');
  });
}
