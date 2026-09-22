import assert from 'assert';
import should from 'should';

import { coins } from '@bitgo/statics';

import { TransferAcknowledgeBuilder, Transaction } from '../../../../src';
import { TransferAcknowledge } from '../../../../src/lib/iface';

import { TransferAcknowledgeRequest } from '../../../resources';

describe('Transfer Acknowledge Builder', () => {
  it('should get the transfer acknowledge request object', function () {
    const txBuilder = new TransferAcknowledgeBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    const { contractId, updateId, senderPartyId, amount, expiryEpoch } = TransferAcknowledgeRequest;
    txBuilder
      .contractId(contractId)
      .senderPartyId(senderPartyId)
      .updateId(updateId)
      .amount(amount)
      .expiryEpoch(expiryEpoch);
    const requestObj: TransferAcknowledge = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.contractId, contractId);
    assert.equal(requestObj.senderPartyId, senderPartyId);
    assert.equal(requestObj.updateId, updateId);
    assert.equal(requestObj.amount, amount);
    assert.equal(requestObj.expiryEpoch, expiryEpoch);
  });
  it('should preserve large amounts through serialized acknowledgement data', function () {
    const txBuilder = new TransferAcknowledgeBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    const { contractId, updateId, senderPartyId, expiryEpoch } = TransferAcknowledgeRequest;
    const amount = '36868615888941900';
    txBuilder
      .contractId(contractId)
      .senderPartyId(senderPartyId)
      .updateId(updateId)
      .amount(amount)
      .expiryEpoch(expiryEpoch);

    const requestObj = txBuilder.toRequestObject();
    assert.strictEqual(requestObj.amount, amount);
    tx.acknowledgeData = requestObj;

    const parsedTx = new Transaction(coins.get('tcanton'));
    parsedTx.fromRawTransaction(tx.toBroadcastFormat());
    assert.strictEqual(parsedTx.toJson().acknowledgeData?.amount, amount);
  });

  it('should normalize bigint acknowledgement amounts to exact strings', function () {
    const txBuilder = new TransferAcknowledgeBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    const { contractId, updateId, senderPartyId, expiryEpoch } = TransferAcknowledgeRequest;
    const amount = '36868615888941900';
    txBuilder
      .contractId(contractId)
      .senderPartyId(senderPartyId)
      .updateId(updateId)
      .amount(BigInt(amount))
      .expiryEpoch(expiryEpoch);

    assert.strictEqual(txBuilder.toRequestObject().amount, amount);
  });
});
