import 'should';
import * as sinon from 'sinon';
import { BitGoJsError } from '../../../src/errors';

describe('Error handling', () => {

  it('should construct custom errors if Error.captureStackTrace is missing', function () {
    const captureStub = sinon.stub(Error, 'captureStackTrace').value(undefined);
    new BitGoJsError();
    captureStub.callCount.should.equal(0);
    captureStub.restore();
  });

  it('should construct custom errors with Error.captureStackTrace if present', function () {
    const captureStub = sinon.stub(Error, 'captureStackTrace').returns();
    new BitGoJsError();
    captureStub.callCount.should.equal(1);
    captureStub.restore();
  });

  it('should capture stack trace', function namedFunc() {
    const bitGoJsError = new BitGoJsError();
    bitGoJsError.stack!.should.match(/at new BitGoJsError/);
    bitGoJsError.stack!.should.match(/at Context\.namedFunc/);
  });
});
