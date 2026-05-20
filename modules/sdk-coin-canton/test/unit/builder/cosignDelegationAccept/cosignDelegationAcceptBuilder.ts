import assert from 'assert';
import should from 'should';

import { coins } from '@bitgo/statics';

import { CosignDelegationAcceptBuilder, Transaction } from '../../../../src';
import { CantonTransferAcceptRejectRequest } from '../../../../src/lib/iface';

const commandId = '3935a06d-3b03-41be-99a5-95b2ecaabf7d';
const contractId =
  '001b549bfa833bab661ab30e4d0a3ab0ec01fcc4a2bef5369795f4928147706353ca1112205a8d0e780cf3b3115cf8be0d6315f4aed6a1c25b67e8c5d64cf9848d0458fd17';
const actAsPartyId = '12205::12205b4e3537a95126d90604592344d8ad3c3ddccda4f79901954280ee19c576714d';

describe('CosignDelegationAccept Builder', () => {
  it('should get the cosign delegation accept request object', function () {
    const txBuilder = new CosignDelegationAcceptBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.commandId(commandId).contractId(contractId).actAs(actAsPartyId);
    const requestObj: CantonTransferAcceptRejectRequest = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.commandId, commandId);
    assert.equal(requestObj.contractId, contractId);
    assert.equal(requestObj.actAs.length, 1);
    assert.equal(requestObj.actAs[0], actAsPartyId);
    assert.deepEqual(requestObj.readAs, []);
    assert.equal(requestObj.verboseHashing, false);
  });

  it('should set transaction id from commandId', function () {
    const txBuilder = new CosignDelegationAcceptBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.commandId(commandId);
    assert.equal(txBuilder.transaction.id, commandId);
  });

  it('should throw if commandId is missing', function () {
    const txBuilder = new CosignDelegationAcceptBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.contractId(contractId).actAs(actAsPartyId);
    assert.throws(() => txBuilder.toRequestObject(), /commandId is missing/);
  });

  it('should throw if contractId is missing', function () {
    const txBuilder = new CosignDelegationAcceptBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.commandId(commandId).actAs(actAsPartyId);
    assert.throws(() => txBuilder.toRequestObject(), /contractId is missing/);
  });

  it('should throw if actAs is missing', function () {
    const txBuilder = new CosignDelegationAcceptBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.commandId(commandId).contractId(contractId);
    assert.throws(() => txBuilder.toRequestObject(), /actAs partyId is missing/);
  });

  it('should throw if commandId is empty string', function () {
    const txBuilder = new CosignDelegationAcceptBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    assert.throws(() => txBuilder.commandId(''), /commandId must be a non-empty string/);
  });

  it('should throw if contractId is empty string', function () {
    const txBuilder = new CosignDelegationAcceptBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    assert.throws(() => txBuilder.contractId(''), /contractId must be a non-empty string/);
  });

  it('should throw if actAs is empty string', function () {
    const txBuilder = new CosignDelegationAcceptBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    assert.throws(() => txBuilder.actAs(''), /actAsPartyId must be a non-empty string/);
  });
});
