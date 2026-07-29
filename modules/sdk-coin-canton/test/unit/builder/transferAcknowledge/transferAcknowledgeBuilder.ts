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
});
