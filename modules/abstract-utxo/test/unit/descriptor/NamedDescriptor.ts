import assert from 'assert';

import * as testutils from '@bitgo/wasm-utxo/testutils';

import { assertHasValidSignature, createNamedDescriptorWithSignature } from '../../../src/descriptor/NamedDescriptor';
import { getDescriptorFromBuilder } from '../../../src/descriptor/builder';

describe('NamedDescriptor', function () {
  it('creates named descriptor with signature', async function () {
    const keys = testutils.getKeyTriple('default');
    const namedDescriptor = createNamedDescriptorWithSignature(
      'foo',
      getDescriptorFromBuilder({ name: 'Wsh2Of2', keys, path: '0/*' }),
      keys[0]
    );
    assert.deepStrictEqual(
      await testutils.getFixture(__dirname + '/fixtures/NamedDescriptorWithSignature.json', namedDescriptor),
      namedDescriptor
    );
    assertHasValidSignature(namedDescriptor, keys[0]);
  });
});
