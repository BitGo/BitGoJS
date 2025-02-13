import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import { getFixture, getKey, toPlainObject } from '@bitgo/utxo-core/testutil';
import { ast, Miniscript } from '@bitgo/wasm-miniscript';

import { StakingScriptData } from './vendor/stakingScript';

function getKeyBuffer(key: string): Buffer {
  return getKey(key).publicKey.subarray(1);
}

function parseScript(key: string, script: unknown) {
  if (!Buffer.isBuffer(script)) {
    throw new Error('script must be a buffer');
  }
  const ms = Miniscript.fromBitcoinScript(script, 'tap');
  return {
    script: script.toString('hex'),
    miniscript: ms.toString(),
    miniscriptAst: ast.fromMiniscript(ms),
    scriptASM: utxolib.script.toASM(script).split(/\s+/),
  };
}

function parseScripts(scripts: unknown) {
  if (typeof scripts !== 'object' || scripts === null) {
    throw new Error('scripts must be an object');
  }
  return Object.fromEntries(Object.entries(scripts).map(([key, value]) => [key, parseScript(key, value)]));
}

async function assertEqualFixture(fixtureName: string, builder: StakingScriptData, scripts: unknown): Promise<void> {
  const value = {
    builder: toPlainObject(builder),
    scripts: parseScripts(scripts),
  };
  // await fs.promises.unlink(fixtureName);
  assert.deepStrictEqual(await getFixture(fixtureName, value), value);
}

describe('staking scripts', function () {
  it('generates expected staking scripts', async function () {
    const stakerKey = getKeyBuffer('staker');
    const finalityProviderKeys = [getKeyBuffer('finalityProvider')];
    const covenantKeys = [getKeyBuffer('covenant1'), getKeyBuffer('covenant2')];
    const covenantThreshold = 2;
    const stakingTimelock = 100;
    const unbondingTimelock = 200;
    const builder = new StakingScriptData(
      stakerKey,
      finalityProviderKeys,
      covenantKeys,
      covenantThreshold,
      stakingTimelock,
      unbondingTimelock
    );
    await assertEqualFixture('test/fixtures/babylon/scripts.json', builder, builder.buildScripts());
  });
});
