import * as assert from 'assert';
import { getKey } from '../testutil';

describe('bip32', function () {
  it('derivation', function () {
    const k = getKey('lol');
    const km12 = k.derivePath('m/1/2');
    const km1 = k.derivePath('m/1');
    const km12FromM1 = km1.derivePath('2');
    assert.strictEqual(km12.toBase58(), km12FromM1.toBase58());

    assert.throws(
      () => km1.derivePath('m/2'),
      (e) => e.message === 'Expected master, got child'
    );
  });
});
