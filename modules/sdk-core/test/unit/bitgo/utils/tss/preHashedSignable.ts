import * as assert from 'assert';
import { isAvalancheAtomicTx, isCoinWithPreHashedSignable } from '../../../../../src/bitgo/utils/tss/preHashedSignable';

describe('preHashedSignable', function () {
  it('isAvalancheAtomicTx detects codec prefix 0000', function () {
    assert.strictEqual(
      isAvalancheAtomicTx({
        serializedTxHex: '0000000000010000007278db5c',
        signableHex: 'abc',
      }),
      true
    );
    assert.strictEqual(
      isAvalancheAtomicTx({
        serializedTxHex: 'f86c808504a817c800825208',
        signableHex: 'f86c808504a817c800825208',
      }),
      false
    );
  });

  it('isCoinWithPreHashedSignable type guard', function () {
    assert.strictEqual(isCoinWithPreHashedSignable({ isSignablePreHashed: () => true }), true);
    assert.strictEqual(isCoinWithPreHashedSignable({}), false);
    assert.strictEqual(isCoinWithPreHashedSignable(null), false);
  });
});
