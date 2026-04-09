import assert from 'assert';
import path from 'path';

import * as testutils from '@bitgo/wasm-utxo/testutils';

const { getFixture, jsonNormalize } = testutils;

interface FixtureRoot {
  assertEqualFixture(name: string, v: unknown): Promise<void>;
}

type Normalize = (v: unknown) => unknown;

export function getFixtureRoot(root: string): FixtureRoot {
  return {
    async assertEqualFixture(name: string, v: unknown, normalize: Normalize = jsonNormalize): Promise<void> {
      assert.deepStrictEqual(normalize(v), await getFixture(path.join(root, name), normalize(v)));
    },
  };
}
