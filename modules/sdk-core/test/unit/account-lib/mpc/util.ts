import 'should';
import sinon from 'sinon';
import { DklsUtils, DklsTypes } from '@bitgo/sdk-lib-mpc';
import { combineRound4DklsDsgMessages } from '../../../../src/account-lib/mpc/util';

function makeMsg(from: number, rHex?: string): DklsTypes.SerializedBroadcastMessage {
  return {
    payload: Buffer.from(`payload-${from}`).toString('base64'),
    from,
    signatureR: rHex ? Buffer.from(rHex, 'hex').toString('base64') : undefined,
  };
}

describe('combineRound4DklsDsgMessages', function () {
  let stub: sinon.SinonStub;

  beforeEach(function () {
    stub = sinon.stub(DklsUtils, 'combinePartialSignatures').returns({
      R: new Uint8Array([1, 2, 3]),
      S: new Uint8Array([4, 5, 6]),
    });
  });

  afterEach(function () {
    stub.restore();
  });

  it('throws when no message contains signatureR', function () {
    const msgs = [makeMsg(0), makeMsg(1), makeMsg(2)];
    (() => combineRound4DklsDsgMessages(msgs)).should.throw(
      'None of the round 4 Dkls messages contain a Signature.R value.'
    );
  });

  it('throws when parties provide different signatureR values', function () {
    const msgs = [makeMsg(0, 'aabbcc'), makeMsg(1, 'ddeeff'), makeMsg(2, 'aabbcc')];
    (() => combineRound4DklsDsgMessages(msgs)).should.throw(
      'signatureR mismatch across parties — possible protocol attack'
    );
  });

  it('succeeds when all parties agree on signatureR', function () {
    const rHex = 'aabbccddeeff0011';
    const msgs = [makeMsg(0, rHex), makeMsg(1, rHex), makeMsg(2, rHex)];
    const result = combineRound4DklsDsgMessages(msgs);
    result.should.have.property('R');
    result.should.have.property('S');
    stub.calledOnce.should.be.true();
    stub.firstCall.args[1].should.equal(rHex);
  });

  it('succeeds when only one party provides signatureR', function () {
    const rHex = 'cafebabe';
    const msgs = [makeMsg(0, rHex), makeMsg(1), makeMsg(2)];
    const result = combineRound4DklsDsgMessages(msgs);
    result.should.have.property('R');
    stub.calledOnce.should.be.true();
  });
});
