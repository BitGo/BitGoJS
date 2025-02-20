import assert from 'assert';

import * as bitcoinjslib from 'bitcoinjs-lib';
import * as utxolib from '@bitgo/utxo-lib';
import { getFixture, getKey, toPlainObject } from '@bitgo/utxo-core/testutil';
import { ast, Descriptor, Miniscript } from '@bitgo/wasm-miniscript';
import { createAddressFromDescriptor } from '@bitgo/utxo-core/descriptor';

import { BabylonDescriptorBuilder } from '../../../src/babylon';

import * as vendor from './vendor/btc-staking-ts/src';
import * as vendorUtilsStaking from './vendor/btc-staking-ts/src/utils/staking';

bitcoinjslib.initEccLib(utxolib.ecc);

function getKeyBuffer(key: string): Buffer {
  return getKey(key).publicKey.subarray(1);
}

function getKeyBuffers(key: string, count: number): Buffer[] {
  return Array.from({ length: count }, (_, i) => getKeyBuffer(`${key}${i}`));
}

function mockUtxo(): vendor.UTXO {
  const key = getKey('p2wpkh');
  const descriptor = Descriptor.fromString(
    ast.formatNode({
      wpkh: key.publicKey.toString('hex'),
    }),
    'definite'
  );
  const scriptPubKey = Buffer.from(descriptor.scriptPubkey());
  const witnessScript = Buffer.from(descriptor.encode());
  return {
    rawTxHex: undefined,
    txid: Buffer.alloc(32).fill(0x11).toString('hex'),
    value: 22_222,
    vout: 0,
    redeemScript: undefined,
    witnessScript: witnessScript.toString('hex'),
    scriptPubKey: scriptPubKey.toString('hex'),
  };
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

async function assertEqualsFixture(fixtureName: string, value: unknown): Promise<void> {
  assert.deepStrictEqual(await getFixture(fixtureName, value), value);
}

async function assertScriptsEqualFixture(
  fixtureName: string,
  builder: vendor.StakingScriptData,
  scripts: unknown
): Promise<void> {
  await assertEqualsFixture(fixtureName, {
    builder: toPlainObject(builder),
    scripts: parseScripts(scripts),
  });
}

async function assertTransactionEqualsFixture(fixtureName: string, tx: unknown): Promise<void> {
  await assertEqualsFixture(fixtureName, toPlainObject(tx));
}

function assertEqualsMiniscript(script: Buffer, miniscript: ast.MiniscriptNode): void {
  const ms = Miniscript.fromBitcoinScript(script, 'tap');
  assert.deepStrictEqual(ast.fromMiniscript(ms), miniscript);
  assert.deepStrictEqual(
    script.toString('hex'),
    Buffer.from(Miniscript.fromString(ast.formatNode(miniscript), 'tap').encode()).toString('hex')
  );
}

function assertEqualScripts(descriptorBuilder: BabylonDescriptorBuilder, builder: vendor.StakingScripts) {
  for (const [key, script] of Object.entries(builder) as [keyof vendor.StakingScripts, Buffer][]) {
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
  const stakerKey = getKeyBuffer('staker');
  const covenantThreshold = 2;
  const stakingTimelock = 100;
  const unbondingTimelock = 200;

  const vendorBuilder = new vendor.StakingScriptData(
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

  describe(`Babylon Staking [${tag}]`, function () {
    it('generates expected staking scripts', async function () {
      await assertScriptsEqualFixture(
        `test/fixtures/babylon/scripts.${tag}.json`,
        vendorBuilder,
        vendorBuilder.buildScripts()
      );
    });

    it('matches inner taproot scripts', function () {
      assertEqualScripts(descriptorBuilder, vendorBuilder.buildScripts());
    });

    it('matches output scripts', function () {
      assertEqualOutputScript(
        vendorUtilsStaking.deriveStakingOutputInfo(vendorBuilder.buildScripts(), bitcoinjslib.networks.bitcoin),
        descriptorBuilder.getStakingDescriptor()
      );
      assertEqualOutputScript(
        vendorUtilsStaking.deriveSlashingOutput(vendorBuilder.buildScripts(), bitcoinjslib.networks.bitcoin),
        descriptorBuilder.getSlashingDescriptor()
      );
      assertEqualOutputScript(
        vendorUtilsStaking.deriveUnbondingOutputInfo(vendorBuilder.buildScripts(), bitcoinjslib.networks.bitcoin),
        descriptorBuilder.getUnbondingDescriptor()
      );
    });

    describe('Staking Transaction', async function () {
      it('has expected transaction', async function () {
        const amount = 1111;
        const changeAddress = createAddressFromDescriptor(
          descriptorBuilder.getStakingDescriptor(),
          undefined,
          utxolib.networks.bitcoin
        );
        const feeRateSatB = 2;
        const stakingTx = vendor.stakingTransaction(
          vendorBuilder.buildScripts(),
          amount,
          changeAddress,
          [mockUtxo()],
          bitcoinjslib.networks.bitcoin,
          feeRateSatB
        );
        await assertTransactionEqualsFixture(`test/fixtures/babylon/transaction.${tag}.json`, stakingTx);
        assert.deepStrictEqual(stakingTx.transaction.outs, [
          {
            script: Buffer.from(descriptorBuilder.getStakingDescriptor().scriptPubkey()),
            value: amount,
          },
          {
            script: utxolib.address.toOutputScript(changeAddress, utxolib.networks.bitcoin),
            value: mockUtxo().value - amount - stakingTx.fee,
          },
        ]);
      });
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
