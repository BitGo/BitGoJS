import 'should';
import { BitGoJsError, NodeEnvironmentError } from '../../../src/errors';

describe('Error handling', () => {
  it('should capture stack trace', function namedFunc() {
    const bitGoJsError = new BitGoJsError();
    bitGoJsError.stack!.should.match(/BitGoJsError:/);
    bitGoJsError.stack!.should.match(/at Context\.namedFunc/);

    (new NodeEnvironmentError()).stack!.should.match(/NodeEnvironmentError:/);
  });
});
