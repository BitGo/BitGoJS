import { Transaction } from '../../src';
import { coins } from '@bitgo/statics';
import assert from 'assert';
import should from 'should';
import utils from '../../src/lib/utils';
import { InvalidTransactionError } from '@bitgo/sdk-core';
import * as testData from '../resources/icp';
import { getBuilderFactory } from './getBuilderFactory';
import sinon from 'sinon';

describe('ICP Transaction', () => {
  let tx: Transaction;
  let serializedTxHex: any;
  const config = coins.get('ticp');

  beforeEach(() => {
    tx = new Transaction(config);
    const serializedTxFormat = {
      serializedTxHex: testData.PayloadsData,
      publicKey: testData.Accounts.account1.publicKey,
    };
    serializedTxHex = Buffer.from(JSON.stringify(serializedTxFormat), 'utf-8').toString('hex');
    sinon.stub(utils, 'validateExpireTime').returns(true);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should throw an empty transaction error', () => {
    assert.throws(
      () => tx.toBroadcastFormat(),
      (err) => err instanceof InvalidTransactionError && err.message === 'Empty transaction',
      'Expected an InvalidTransactionError with message "Empty transaction"'
    );
    assert.throws(
      () => tx.toJson(),
      (err) => err instanceof InvalidTransactionError && err.message === 'Empty transaction',
      'Expected an InvalidTransactionError with message "Empty transaction"'
    );
  });

  it('start and build a txn with builder init method', async () => {
    const txn = new Transaction(config);
    txn.icpTransactionData = testData.IcpTransactionData;
    const factory = getBuilderFactory('ticp');
    const txBuilder = factory.getTransferBuilder();
    txBuilder.initBuilder(txn);
    await txBuilder.build();

    const icpTransaction = txBuilder.transaction.icpTransaction;
    const payloadsData = txBuilder.transaction.payloadsData;
    should.equal(icpTransaction.metadata.memo, testData.IcpTransactionData.memo);
    should.equal(icpTransaction.operations[0].account.address, testData.IcpTransactionData.senderAddress);
    should.equal(icpTransaction.operations[1].account.address, testData.IcpTransactionData.receiverAddress);
    should.equal(icpTransaction.operations[1].amount.value, testData.IcpTransactionData.amount);
    should.equal(icpTransaction.operations[2].amount.value, testData.IcpTransactionData.fee);
    should.equal(icpTransaction.public_keys[0].hex_bytes, testData.IcpTransactionData.senderPublicKeyHex);
    payloadsData.payloads.should.be.an.Array();
    payloadsData.payloads.length.should.equal(1);
  });

  it('build a json transaction from raw hex', async () => {
    await tx.fromRawTransaction(serializedTxHex);
    const json = tx.toJson();
    should.equal(json.memo, testData.ParsedRawTransaction.metadata.memo);
    should.equal(json.feeAmount, testData.ParsedRawTransaction.operations[2].amount.value);
    should.equal(json.sender, testData.ParsedRawTransaction.operations[0].account.address);
    should.equal(json.recipient, testData.ParsedRawTransaction.operations[1].account.address);
    should.equal(json.senderPublicKey, testData.Accounts.account1.publicKey);
    should.equal(json.id, testData.OnChainTransactionHash);
  });

  it('explain transaction', async () => {
    await tx.fromRawTransaction(serializedTxHex);
    const explain = tx.explainTransaction();

    explain.outputAmount.should.equal('10');
    explain.outputs[0].amount.should.equal('10');
    explain.outputs[0].address.should.equal(testData.Accounts.account2.address);
    explain.fee.fee.should.equal('-10000');
    explain.changeAmount.should.equal('0');
    if (explain.displayOrder !== undefined) {
      explain.displayOrder.should.deepEqual(['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee']);
    }
  });
});
