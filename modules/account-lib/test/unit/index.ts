import assert from 'assert';
import { getBuilder } from '../../src';

describe('Coin factory', () => {
  it('should fail to instantiate an unsupported coin', () => {
    assert.throws(() => getBuilder('fakeUnsupported'));
  });

  it('should return the ETH builder for sepeth', () => {
    const sepethBuilder = getBuilder('sepeth');
    const htethBuilder = getBuilder('hteth');
    assert.ok(sepethBuilder);
    assert.strictEqual(sepethBuilder.constructor, htethBuilder.constructor);
  });
});
