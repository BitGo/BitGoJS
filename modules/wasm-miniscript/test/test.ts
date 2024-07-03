import * as assert from 'assert';
import { descriptorNodesFromString, miniscriptNodesFromString } from '../js';
import { fixtures } from './descriptorFixtures';

describe('AST', function () {
  it('should get ast', function () {
    const pubkey = Buffer.alloc(32, 1).toString('hex');
    const result = miniscriptNodesFromString(`multi_a(1,${pubkey})`, 'tap');
    console.dir(result, { depth: null });
  });
});

describe('Descriptor fixtures', function () {
  fixtures.valid.forEach((fixture, i) => {
    it('should parse fixture ' + i, function () {
      assert.doesNotThrow(() => descriptorNodesFromString(fixture.descriptor));
    });
  });
});
