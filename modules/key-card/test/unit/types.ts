import 'should';
import { SAFE_ROOT_ORDER } from '../../src/types';

describe('SAFE_ROOT_ORDER', function () {
  it('keeps the render order the printed card layout depends on', function () {
    SAFE_ROOT_ORDER.should.deepEqual(['secp256k1Multisig', 'ecdsaMpc', 'eddsaMpc', 'ed25519Multisig']);
  });
});
