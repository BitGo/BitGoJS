import * as assert from 'assert';

import { powerset } from '../src/combinations';
describe('powerset', function () {
  it('has expected results', function () {
    assert.deepStrictEqual(powerset([1, 2, 3]), [[1, 2, 3], [2, 3], [1, 3], [3], [1, 2], [2], [1], []]);
  });
});
