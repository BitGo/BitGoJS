import { formatTreeNoColor, getFixtureString } from './fixtures';
import { parseXpub } from '../src/bip32';
import * as assert from 'assert';
import { getKey } from './bip32.util';

function runTest(xpub: string, args: { derive?: string }) {
  describe('parse xpub', function () {
    it('parses xpub', async function () {
      const formatted = formatTreeNoColor(parseXpub(xpub, args), { showAll: true });
      const filename = [xpub];
      if (args.derive) {
        filename.push(args.derive.replace(/\//g, '_'));
      }
      assert.strictEqual(await getFixtureString(`test/fixtures/xpub/${filename.join('_')}.txt`, formatted), formatted);
    });
  });
}

runTest(getKey('parseXpub').neutered().toBase58(), {});
runTest(getKey('parseXpub').neutered().toBase58(), { derive: 'm/0/0' });
