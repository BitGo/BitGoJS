import assert from 'assert';
import should from 'should';

import { coins } from '@bitgo/statics';

import { EndInvestorOnboardingOfferBuilder, Transaction } from '../../../../src';
import { EndInvestorOnboardingOfferData } from '../../../../src/lib/iface';

const contractId =
  '0020108b7aee0e0215538668a7ebb00e7e811135ff2ebf23137760056e077b9347ca121220dfa25cd905caba01345b515d1002af94b0ba2a9c2e9a6751c07ed28795454a9e';
const endInvestorPartyId = 'end-investor-1::1220460fe6779731682d05fb151822f20f4a756f1d6fe84f38b8d91172947adbae24';
const participantPartyId = 'bd::1220460fe6779731682d05fb151822f20f4a756f1d6fe84f38b8d91172947adbae24';
const comment = 'welcome to DTCC onboarding';

// Helper to set all required fields on a builder
function buildWithAllRequired(txBuilder: EndInvestorOnboardingOfferBuilder): EndInvestorOnboardingOfferBuilder {
  return txBuilder.contractId(contractId).endInvestorPartyId(endInvestorPartyId).participantPartyId(participantPartyId);
}

describe('EndInvestorOnboardingOffer Builder', () => {
  it('should build the request object with all required fields', function () {
    const txBuilder = new EndInvestorOnboardingOfferBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    buildWithAllRequired(txBuilder).comment(comment);
    const requestObj: EndInvestorOnboardingOfferData = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.contractId, contractId);
    assert.equal(requestObj.endInvestorPartyId, endInvestorPartyId);
    assert.equal(requestObj.participantPartyId, participantPartyId);
    assert.equal(requestObj.comment, comment);
  });

  it('should build the request object without optional comment', function () {
    const txBuilder = new EndInvestorOnboardingOfferBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    buildWithAllRequired(txBuilder);
    const requestObj: EndInvestorOnboardingOfferData = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.comment, undefined);
  });

  it('should set the transaction id to the contractId', function () {
    const txBuilder = new EndInvestorOnboardingOfferBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.contractId(contractId);
    assert.equal(tx.id, contractId);
  });

  it('should produce a round-trippable serialized transaction', function () {
    const txBuilder = new EndInvestorOnboardingOfferBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    buildWithAllRequired(txBuilder).comment(comment);
    const requestObj = txBuilder.toRequestObject();
    tx.endInvestorOnboardingOfferData = requestObj;

    const serialized = tx.toBroadcastFormat();
    const tx2 = new Transaction(coins.get('tcanton'));
    tx2.fromRawTransaction(serialized);
    const tx2Json = tx2.toJson();
    should.exist(tx2Json.endInvestorOnboardingOfferData);
    assert.equal(tx2Json.endInvestorOnboardingOfferData!.contractId, contractId);
    assert.equal(tx2Json.endInvestorOnboardingOfferData!.endInvestorPartyId, endInvestorPartyId);
    assert.equal(tx2Json.endInvestorOnboardingOfferData!.participantPartyId, participantPartyId);
    assert.equal(tx2Json.endInvestorOnboardingOfferData!.comment, comment);
  });

  it('should return DUMMY_HASH as the signable payload', function () {
    const txBuilder = new EndInvestorOnboardingOfferBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    buildWithAllRequired(txBuilder);
    const requestObj = txBuilder.toRequestObject();
    tx.endInvestorOnboardingOfferData = requestObj;
    // signablePayload must be non-empty (it returns the DUMMY_HASH buffer)
    assert.ok(tx.signablePayload.length > 0);
  });

  // --- missing required field tests ---

  it('should throw if contractId is missing', function () {
    const txBuilder = new EndInvestorOnboardingOfferBuilder(coins.get('tcanton'));
    txBuilder.initBuilder(new Transaction(coins.get('tcanton')));
    txBuilder.endInvestorPartyId(endInvestorPartyId).participantPartyId(participantPartyId);
    assert.throws(() => txBuilder.toRequestObject(), /contractId is missing/);
  });

  it('should throw if endInvestorPartyId is missing', function () {
    const txBuilder = new EndInvestorOnboardingOfferBuilder(coins.get('tcanton'));
    txBuilder.initBuilder(new Transaction(coins.get('tcanton')));
    txBuilder.contractId(contractId).participantPartyId(participantPartyId);
    assert.throws(() => txBuilder.toRequestObject(), /endInvestorPartyId is missing/);
  });

  it('should throw if participantPartyId is missing', function () {
    const txBuilder = new EndInvestorOnboardingOfferBuilder(coins.get('tcanton'));
    txBuilder.initBuilder(new Transaction(coins.get('tcanton')));
    txBuilder.contractId(contractId).endInvestorPartyId(endInvestorPartyId);
    assert.throws(() => txBuilder.toRequestObject(), /participantPartyId is missing/);
  });

  // --- invalid setter argument tests ---

  it('should throw if contractId is an empty string', function () {
    const txBuilder = new EndInvestorOnboardingOfferBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.contractId(''), /contractId must be a non-empty string/);
  });

  it('should throw if endInvestorPartyId is an empty string', function () {
    const txBuilder = new EndInvestorOnboardingOfferBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.endInvestorPartyId(''), /endInvestorPartyId must be a non-empty string/);
  });

  it('should throw if participantPartyId is an empty string', function () {
    const txBuilder = new EndInvestorOnboardingOfferBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.participantPartyId(''), /participantPartyId must be a non-empty string/);
  });

  // --- not-implemented methods ---

  it('should throw on setTransaction', function () {
    const txBuilder = new EndInvestorOnboardingOfferBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.setTransaction({} as any), /Not implemented/);
  });

  it('should throw on addSignature', function () {
    const txBuilder = new EndInvestorOnboardingOfferBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.addSignature({} as any, Buffer.from('')), /Not implemented/);
  });
});
