import assert from 'assert';
import should from 'should';

import { coins } from '@bitgo/statics';

import { CosignDelegationProposalBuilder, Transaction } from '../../../../src';
import { CosignDelegationProposal } from '../../../../src/lib/iface';

const contractId =
  '001b549bfa833bab661ab30e4d0a3ab0ec01fcc4a2bef5369795f4928147706353ca1112205a8d0e780cf3b3115cf8be0d6315f4aed6a1c25b67e8c5d64cf9848d0458fd17';
const operatorId = '12205::12205b4e3537a95126d90604592344d8ad3c3ddccda4f79901954280ee19c576714d';
const packageName = 'splice-amulet';
const submissionId = '12205b4e3537a95126d90604592344d8ad3c3ddccda4f79901954280ee19c576714d';

describe('CosignDelegationProposal Builder', () => {
  it('should get the cosign delegation proposal request object', function () {
    const txBuilder = new CosignDelegationProposalBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    tx.id = submissionId;
    txBuilder.initBuilder(tx);
    txBuilder.contractId(contractId).operatorId(operatorId).packageName(packageName);
    const requestObj: CosignDelegationProposal = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.contractId, contractId);
    assert.equal(requestObj.operatorId, operatorId);
    assert.equal(requestObj.packageName, packageName);
  });

  it('should get the cosign delegation proposal request object without packageName', function () {
    const txBuilder = new CosignDelegationProposalBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    tx.id = submissionId;
    txBuilder.initBuilder(tx);
    txBuilder.contractId(contractId).operatorId(operatorId);
    const requestObj: CosignDelegationProposal = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.contractId, contractId);
    assert.equal(requestObj.operatorId, operatorId);
    assert.equal(requestObj.packageName, undefined);
  });

  it('should throw if contractId is missing', function () {
    const txBuilder = new CosignDelegationProposalBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    tx.id = submissionId;
    txBuilder.initBuilder(tx);
    txBuilder.operatorId(operatorId);
    assert.throws(() => txBuilder.toRequestObject(), /contractId is missing/);
  });

  it('should throw if operatorId is missing', function () {
    const txBuilder = new CosignDelegationProposalBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    tx.id = submissionId;
    txBuilder.initBuilder(tx);
    txBuilder.contractId(contractId);
    assert.throws(() => txBuilder.toRequestObject(), /operatorId is missing/);
  });

  it('should throw if contractId is empty string', function () {
    const txBuilder = new CosignDelegationProposalBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    tx.id = submissionId;
    txBuilder.initBuilder(tx);
    assert.throws(() => txBuilder.contractId(''), /contractId must be a non-empty string/);
  });

  it('should throw if operatorId is empty string', function () {
    const txBuilder = new CosignDelegationProposalBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    tx.id = submissionId;
    txBuilder.initBuilder(tx);
    assert.throws(() => txBuilder.operatorId(''), /operatorId must be a non-empty string/);
  });

  it('should throw on setTransaction', function () {
    const txBuilder = new CosignDelegationProposalBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.setTransaction({} as any), /Not implemented/);
  });

  it('should throw on addSignature', function () {
    const txBuilder = new CosignDelegationProposalBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.addSignature({} as any, Buffer.from('')), /Not implemented/);
  });
});
