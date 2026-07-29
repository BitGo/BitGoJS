import assert from 'assert';
import should from 'should';

import { TransactionBuilder } from '../../../src';
import { ETHTransactionType, TxData } from '@bitgo/sdk-coin-eth';
import * as testData from '../../resources/avaxc';
import { TransactionType } from '@bitgo/sdk-core';
import { getBuilder } from '../getBuilder';

describe('Avax C-Chain Transfer Transaction', function () {
  let txBuilder: TransactionBuilder;
  const contractAddress = testData.TEST_ACCOUNT.ethAddress;
  const initTxBuilder = (): void => {
    txBuilder = getBuilder('tavaxc') as TransactionBuilder;
    txBuilder.fee({
      fee: '280000000000',
      gasLimit: '7000000',
    });
    txBuilder.counter(1);
    txBuilder.type(TransactionType.Send);
    txBuilder.contract(contractAddress);
  };

  it('Should build transfer tx', async function () {
    initTxBuilder();
    txBuilder
      .transfer()
      .amount('100000000000000000') // This represents 0.1 Avax = 0.1 Ether
      .contractSequenceId(1)
      .expirationTime(50000)
      .to(testData.TEST_ACCOUNT_2.ethAddress)
      .key(testData.OWNER_2.ethKey);
    txBuilder.sign({ key: testData.OWNER_1.ethKey });

    const tx = await txBuilder.build();
    const txJson: TxData = tx.toJson();

    should.exists(txJson.chainId);
    should.exists(txJson.from);
    should.exists(txJson.to);
    txJson.nonce.should.equals(1);
    txJson.from?.should.equals(testData.OWNER_1.ethAddress);
    txJson.chainId?.should.equals('0xa869');
    txJson.gasLimit.should.equals('7000000');
    txJson._type.should.equals(ETHTransactionType.LEGACY);
    txJson.gasPrice!.should.equals('280000000000');
  });

  it('Should build with counter 0 if not manually defined', async function () {
    const builder = getBuilder('tavaxc') as TransactionBuilder;
    builder.fee({
      fee: '280000000000',
      gasLimit: '7000000',
    });
    builder.type(TransactionType.Send);
    builder.contract(testData.TEST_ACCOUNT.ethAddress);
    builder
      .transfer()
      .amount('100000000000000000') // This represents 0.1 Avax = 0.1 Ether
      .contractSequenceId(1)
      .expirationTime(50000)
      .to(testData.TEST_ACCOUNT_2.ethAddress)
      .key(testData.OWNER_2.ethKey);
    builder.sign({ key: testData.OWNER_1.ethKey });

    const tx = await builder.build();

    const txJson: TxData = tx.toJson();

    should.exists(txJson.chainId);
    should.exists(txJson.from);
    should.exists(txJson.to);
    txJson.nonce.should.equals(0);
    txJson.from!.should.equals(testData.OWNER_1.ethAddress);
    txJson.chainId!.should.equals('0xa869');
    txJson.gasLimit.should.equals('7000000');
    txJson._type.should.equals(ETHTransactionType.LEGACY);
    txJson.gasPrice!.should.equals('280000000000');
  });

  it('Should build transfer with default type', async function () {
    const builder = getBuilder('tavaxc') as TransactionBuilder;
    builder.fee({
      fee: '280000000000',
      gasLimit: '7000000',
    });
    builder.counter(1);
    builder.contract(testData.TEST_ACCOUNT.ethAddress);
    builder
      .transfer()
      .amount('100000000000000000') // This represents 0.1 Avax = 0.1 Ether
      .contractSequenceId(1)
      .expirationTime(50000)
      .to(testData.TEST_ACCOUNT_2.ethAddress)
      .key(testData.OWNER_2.ethKey);
    builder.sign({ key: testData.OWNER_1.ethKey });

    const tx = await builder.build();
    const txJson: TxData = tx.toJson();

    should.exists(txJson.chainId);
    should.exists(txJson.from);
    should.exists(txJson.to);
    txJson.nonce.should.equals(1);
    txJson.from?.should.equals(testData.OWNER_1.ethAddress);
    txJson.chainId?.should.equals('0xa869');
    txJson.gasLimit.should.equals('7000000');
    txJson._type.should.equals(ETHTransactionType.LEGACY);
    txJson.gasPrice!.should.equals('280000000000');
  });

  it('Should create transfer object if not created or return it if already initialized', async function () {
    const builder = getBuilder('tavaxc') as TransactionBuilder;
    builder.fee({
      fee: '280000000000',
      gasLimit: '7000000',
    });
    builder.counter(1);
    builder.contract(testData.TEST_ACCOUNT.ethAddress);
    builder.type(TransactionType.Send);
    const transferObj = builder.transfer().amount('5000').contractSequenceId(2).to(testData.TEST_ACCOUNT_2.ethAddress);
    const transferObj2 = builder.transfer();

    should.deepEqual(transferObj2, transferObj);
  });

  it('Should fail building transfer tx without fee', async function () {
    const builder = getBuilder('tavaxc') as TransactionBuilder;
    builder.counter(1);
    builder.type(TransactionType.Send);
    builder.contract(testData.TEST_ACCOUNT.ethAddress);
    builder
      .transfer()
      .amount('100000000000000000') // This represents 0.1 Avax = 0.1 Ether
      .contractSequenceId(1)
      .expirationTime(50000)
      .to(testData.TEST_ACCOUNT_2.ethAddress)
      .key(testData.OWNER_2.ethKey);
    builder.sign({ key: testData.OWNER_1.ethKey });

    builder.build().should.be.rejectedWith('Invalid transaction: missing fee');
  });

  it('Should fail getting transfer object with non-send type', async function () {
    const builder = getBuilder('tavaxc') as TransactionBuilder;
    builder.fee({
      fee: '280000000000',
      gasLimit: '7000000',
    });
    builder.counter(1);
    builder.contract(testData.TEST_ACCOUNT.ethAddress);
    builder.type(TransactionType.WalletInitialization);
    assert.throws(
      () => builder.transfer(),
      (e: any) => e.message === 'Transfers can only be set for send transactions'
    );
  });

  it('Should build unsigned transfer with final v', async function () {
    initTxBuilder();
    txBuilder
      .transfer()
      .amount('100000000000000000') // This represents 0.1 Avax = 0.1 Ether
      .contractSequenceId(1)
      .expirationTime(50000)
      .to(testData.TEST_ACCOUNT_2.ethAddress)
      .key(testData.OWNER_2.ethKey);
    const tx = await txBuilder.build();
    const txJson: TxData = tx.toJson();

    should.exists(txJson.chainId);
    should.exists(txJson.to);
    txJson.nonce.should.equals(1);
    should.equal(txJson.chainId, '0xa869');
    txJson.gasLimit.should.equals('7000000');
    should.equal(txJson.gasPrice, '280000000000');
    should.equal(txJson.v, '0x0150f5');
  });

  it('Should build fee market transaction', async function () {
    initTxBuilder();
    txBuilder.fee({
      fee: '280000000000',
      eip1559: {
        maxPriorityFeePerGas: '5',
        maxFeePerGas: '30',
      },
      gasLimit: '7000000',
    });
    txBuilder
      .transfer()
      .amount('100000000000000000') // This represents 0.1 Avax = 0.1 Ether
      .contractSequenceId(1)
      .expirationTime(50000)
      .to(testData.TEST_ACCOUNT_2.ethAddress)
      .key(testData.OWNER_2.ethKey);
    const tx = await txBuilder.build();
    const txJson: TxData = tx.toJson();

    txJson._type.should.equals(ETHTransactionType.EIP1559);
    should.exists(txJson.chainId);
    should.exists(txJson.to);
    txJson.nonce.should.equals(1);
    should.equal(txJson.chainId, '0xa869');
    txJson.gasLimit.should.equals('7000000');
    should.equal(txJson.maxPriorityFeePerGas, '5');
    should.equal(txJson.maxFeePerGas, '30');
  });
});
