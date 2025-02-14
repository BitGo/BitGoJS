import assert from 'assert';

import * as bitcoinjslib from 'bitcoinjs-lib';
import * as utxolib from '@bitgo/utxo-lib';
import { getFixture, getKey, toPlainObject } from '@bitgo/utxo-core/testutil';
import { ast, Descriptor, Miniscript } from '@bitgo/wasm-miniscript';

import { BabylonDescriptorBuilder } from '../../../src/babylon/descriptor';

import { StakingScriptData, StakingScripts } from './vendor/btc-staking-ts/src';
import {
  deriveSlashingOutput,
  deriveStakingOutputInfo,
  deriveUnbondingOutputInfo,
} from './vendor/btc-staking-ts/src/utils/staking';

bitcoinjslib.initEccLib(utxolib.ecc);

function getKeyBuffer(key: string): Buffer {
  return getKey(key).publicKey.subarray(1);
}

function getKeyBuffers(key: string, count: number): Buffer[] {
  return Array.from({ length: count }, (_, i) => getKeyBuffer(`${key}${i}`));
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

function assertEqualsMiniscript(script: Buffer, miniscript: ast.MiniscriptNode): void {
  const ms = Miniscript.fromBitcoinScript(script, 'tap');
  assert.deepStrictEqual(ast.fromMiniscript(ms), miniscript);
  assert.deepStrictEqual(
    script.toString('hex'),
    Buffer.from(Miniscript.fromString(ast.formatNode(miniscript), 'tap').encode()).toString('hex')
  );
}

function assertEqualScripts(descriptorBuilder: BabylonDescriptorBuilder, builder: StakingScripts) {
  for (const [key, script] of Object.entries(builder) as [keyof StakingScripts, Buffer][]) {
    switch (key) {
      case 'timelockScript':
        assertEqualsMiniscript(script, descriptorBuilder.getTimelockMiniscript());
        break;
      case 'unbondingScript':
        assertEqualsMiniscript(script, descriptorBuilder.getUnbondingMiniscript());
        break;
      case 'slashingScript':
        assertEqualsMiniscript(script, descriptorBuilder.getSlashingMiniscript());
        break;
      case 'unbondingTimelockScript':
        assertEqualsMiniscript(script, descriptorBuilder.getUnbondingTimelockMiniscript());
        break;
      default:
        throw new Error(`unexpected script key: ${key}`);
    }
  }
}

function assertEqualOutputScript(outputInfo: { scriptPubKey: Buffer }, descriptor: Descriptor) {
  assert.strictEqual(outputInfo.scriptPubKey.toString('hex'), Buffer.from(descriptor.scriptPubkey()).toString('hex'));
}

function describeWithKeys(tag: string, props: { finalityProviderKeys: Buffer[]; covenantKeys: Buffer[] }) {
  describe(`Babylon Staking scripts [${tag}]`, function () {
    const stakerKey = getKeyBuffer('staker');
    const covenantThreshold = 2;
    const stakingTimelock = 100;
    const unbondingTimelock = 200;

    const builder = new StakingScriptData(
      stakerKey,
      props.finalityProviderKeys,
      props.covenantKeys,
      covenantThreshold,
      stakingTimelock,
      unbondingTimelock
    );

    const descriptorBuilder = new BabylonDescriptorBuilder(
      stakerKey,
      props.finalityProviderKeys,
      props.covenantKeys,
      covenantThreshold,
      stakingTimelock,
      unbondingTimelock
    );

    it('generates expected staking scripts', async function () {
      await assertEqualFixture(`test/fixtures/babylon/scripts.${tag}.json`, builder, builder.buildScripts());
    });

    it('matches inner taproot scripts', function () {
      assertEqualScripts(descriptorBuilder, builder.buildScripts());
    });

    it('matches output scripts', function () {
      assertEqualOutputScript(
        deriveStakingOutputInfo(builder.buildScripts(), bitcoinjslib.networks.bitcoin),
        descriptorBuilder.getStakingDescriptor()
      );
      assertEqualOutputScript(
        deriveSlashingOutput(builder.buildScripts(), bitcoinjslib.networks.bitcoin),
        descriptorBuilder.getSlashingDescriptor()
      );
      assertEqualOutputScript(
        deriveUnbondingOutputInfo(builder.buildScripts(), bitcoinjslib.networks.bitcoin),
        descriptorBuilder.getUnbondingDescriptor()
      );
    });
  });
}

describeWithKeys('2f2c', {
  finalityProviderKeys: getKeyBuffers('finalityProvider', 2),
  covenantKeys: getKeyBuffers('covenant', 2),
});

describeWithKeys('3f3c', {
  finalityProviderKeys: getKeyBuffers('finalityProvider', 3),
  covenantKeys: getKeyBuffers('covenant', 3),
});
