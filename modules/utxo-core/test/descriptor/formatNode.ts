import assert from 'assert';

import { formatNode } from '../../src/descriptor';

describe('formatNode', function () {
  it('formats simple nodes', function () {
    assert.strictEqual(formatNode({ pk: 'lol' }), 'pk(lol)');
    assert.strictEqual(formatNode({ after: 1 }), 'after(1)');
    assert.strictEqual(formatNode({ and_v: [{ after: 1 }, { after: 1 }] }), 'and_v(after(1),after(1))');
  });
});
