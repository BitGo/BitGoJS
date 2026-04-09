import assert from 'assert';
import { getBuilder } from '../../src';

describe('Coin factory', () => {
  it('should fail to instantiate an unsupported coin', () => {
    assert.throws(() => getBuilder('fakeUnsupported'));
  });
});
