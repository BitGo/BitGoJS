import assert from 'assert';

import { getFixture } from '../../core/fixtures.utils';

export async function assertEqualFixture(name: string, v: unknown): Promise<void> {
  assert.deepStrictEqual(v, await getFixture(__dirname + '/fixtures/' + name, v));
}
