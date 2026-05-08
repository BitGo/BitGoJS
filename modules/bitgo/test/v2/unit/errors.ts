import 'should';
const assert = require('assert');
import { BitGoJsError, NodeEnvironmentError } from '@bitgo/sdk-core';

describe('Error handling', () => {
  it('should capture stack trace', function namedFunc() {
    const { stack } = new BitGoJsError();
    assert.match(stack, /BitGoJsError/);
    assert.match(stack, /at Context\.namedFunc/);
    new NodeEnvironmentError().stack!.should.match(/NodeEnvironmentError:/);
  });
});
