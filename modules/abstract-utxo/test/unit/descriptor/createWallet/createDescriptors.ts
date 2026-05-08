import assert from 'assert';

import * as testutils from '@bitgo/wasm-utxo/testutils';

import { assertHasValidSignature } from '../../../../src/descriptor/NamedDescriptor';
import { DefaultWsh2Of3 } from '../../../../src/descriptor/createWallet';

describe('createDescriptors', function () {
  it('should create standard named descriptors', async function () {
    const keys = testutils.getKeyTriple('default');
    const namedDescriptors = DefaultWsh2Of3(keys[0], keys.slice(1));
    assert.deepStrictEqual(
      namedDescriptors,
      await testutils.getFixture(__dirname + '/fixtures/DefaultWsh2Of3.json', namedDescriptors)
    );
    for (const namedDescriptor of namedDescriptors) {
      assertHasValidSignature(namedDescriptor, keys[0]);
    }
  });
});
