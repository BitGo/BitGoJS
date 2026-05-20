import * as assert from 'assert';

import { parseBip32 } from '../src/bip32';

import { formatTreeNoColor, getFixtureString } from './fixtures';
import { getKey } from './bip32.util';

function runTest(bip32Key: string, args: { derive?: string }) {
  describe(`parse bip32 ${JSON.stringify(args)}`, function () {
    it('has expected output', async function () {
      const formatted = formatTreeNoColor(parseBip32(bip32Key, args), { showAll: true });
      const filename = [bip32Key];
      if (args.derive) {
        filename.push(args.derive.replace(/\//g, '_'));
      }
      assert.strictEqual(await getFixtureString(`test/fixtures/bip32/${filename.join('_')}.txt`, formatted), formatted);
    });
  });
}

runTest(getKey('bip32').toBase58(), {});
runTest(getKey('bip32').toBase58(), { derive: 'm/0/0' });
runTest(getKey('bip32').neutered().toBase58(), { derive: 'm/0/0' });
