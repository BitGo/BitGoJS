import { VirtualSizes } from '../src';

describe('VirtualSizes', function () {
  it('have expected values', function () {
    VirtualSizes.should.match({
      // check computed values only
      txP2shInputSize: 298,
      txP2shP2wshInputSize: 140,
      txP2wshInputSize: 105,
      txP2trKeypathInputSize: 58,
      txP2trScriptPathLevel1InputSize: 108,
      txP2trScriptPathLevel2InputSize: 116,
      txP2shP2pkInputSize: 151,
    });
  });
});
