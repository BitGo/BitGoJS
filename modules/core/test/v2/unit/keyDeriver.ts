import 'should';
import { Ed25519KeyDeriver } from '../../../src/v2/keyDeriver';
import { keys } from '../fixtures/keyDeriver';

describe('Key Derivation:', () => {
  const verifyTestVector = ({ path, seed, prv, chainCode }) => {
    const derivedKey = Ed25519KeyDeriver.derivePath(path, seed);
    derivedKey.should.have.properties({
      key: Buffer.from(prv, 'hex'),
      chainCode: Buffer.from(chainCode, 'hex'),
    });
  };

  // https://github.com/satoshilabs/slips/blob/master/slip-0010.md#test-vector-1-for-ed25519
  it('should derive SLIP-0010 ed25519 test vector 1', () => {
    verifyTestVector(keys.testVec1);
  });

  // https://github.com/satoshilabs/slips/blob/master/slip-0010.md#test-vector-2-for-ed25519
  it('should derive SLIP-0010 ed25519 test vector 2', () => {
    verifyTestVector(keys.testVec2);
  });
});
