import * as assert from 'assert';
import yargs from 'yargs';

import { cmdFromFixedScript } from '../../src/commands/cmdDescriptor';
import { getFixtureString } from '../fixtures';
import { getKeyTriple } from '../bip32.util';
import { captureConsole } from '../captureConsole';

describe('cmdDescriptor fromFixedScript', function () {
  it('should be a yargs command', function () {
    assert.strictEqual(typeof cmdFromFixedScript.command, 'string');
    assert.strictEqual(typeof cmdFromFixedScript.describe, 'string');
    assert.strictEqual(typeof cmdFromFixedScript.builder, 'function');
    assert.strictEqual(typeof cmdFromFixedScript.handler, 'function');
  });

  it('should output expected descriptor for valid keys', async function () {
    const [userKey, backupKey, bitgoKey] = getKeyTriple('generateAddress').map((k) => k.neutered().toBase58());
    const argv = [
      'fromFixedScript',
      '--userKey',
      userKey,
      '--backupKey',
      backupKey,
      '--bitgoKey',
      bitgoKey,
      '--scriptType',
      'p2sh',
      '--network',
      'testnet',
    ];

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
    const expected = await getFixtureString('test/fixtures/fromFixedScript/descriptors.txt', stdout);
    assert.strictEqual(stdout.trim(), expected.trim());
    assert.strictEqual(stderr, '');
  });
});
