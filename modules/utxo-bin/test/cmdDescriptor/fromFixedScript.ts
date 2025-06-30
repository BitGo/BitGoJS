import * as assert from 'assert';
import yargs from 'yargs';

import { cmdFromFixedScript } from '../../src/commands/cmdDescriptor';
import { getFixtureString } from '../fixtures';
import { getKeyTriple } from '../bip32.util';
import { captureConsole } from '../captureConsole';

function keyArgs(): string[] {
  const [userKey, backupKey, bitgoKey] = getKeyTriple('generateAddress').map((k) => k.neutered().toBase58());
  return ['--userKey', userKey, '--backupKey', backupKey, '--bitgoKey', bitgoKey, '--scriptType', 'p2sh'];
}

describe('cmdDescriptor fromFixedScript', function () {
  function runTest(argv: string[], fixtureName: string) {
    it(`should output expected descriptor (${fixtureName})`, async function () {
      const y = yargs(argv)
        .command(cmdFromFixedScript)
        .exitProcess(false)
        .fail((msg, err) => {
          throw err || new Error(msg);
        });

      const { stdout, stderr } = await captureConsole(async () => {
        await y.parse();
      });

      // Compare output to fixture, or check for expected descriptor substring
      const expected = await getFixtureString(`test/fixtures/fromFixedScript/${fixtureName}.txt`, stdout);
      assert.strictEqual(stdout.trim(), expected.trim());
      assert.strictEqual(stderr, '');
    });
  }

  runTest(['fromFixedScript', ...keyArgs()], 'default');

  runTest(['fromFixedScript', ...keyArgs(), '--network', 'testnet'], 'network-testnet');
});
