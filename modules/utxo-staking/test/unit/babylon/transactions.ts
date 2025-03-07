import assert from 'assert';

import * as vendor from '@bitgo/babylonlabs-io-btc-staking-ts';
import * as bitcoinjslib from 'bitcoinjs-lib';
import * as utxolib from '@bitgo/utxo-lib';
import { ECPairInterface } from '@bitgo/utxo-lib';
import { ast, Descriptor, Miniscript } from '@bitgo/wasm-miniscript';
import { createAddressFromDescriptor } from '@bitgo/utxo-core/descriptor';
import { getFixture, toPlainObject } from '@bitgo/utxo-core/testutil';

import {
  BabylonDescriptorBuilder,
  finalityBabylonProvider0,
  getSignedPsbt,
  testnetStakingParams,
} from '../../../src/babylon';
import { normalize } from '../fixtures.utils';

import { fromXOnlyPublicKey, getECKey, getECKeys, getXOnlyPubkey } from './key.utils';
import { getBitGoUtxoStakingMsgCreateBtcDelegation, getVendorMsgCreateBtcDelegation } from './vendor.utils';

bitcoinjslib.initEccLib(utxolib.ecc);

function getTestnetStakingParams(): vendor.VersionedStakingParams {
  return {
    version: testnetStakingParams.version,
    btcActivationHeight: testnetStakingParams.btc_activation_height,
    covenantNoCoordPks: testnetStakingParams.covenant_pks,
    covenantQuorum: testnetStakingParams.covenant_quorum,
    unbondingTime: testnetStakingParams.unbonding_time_blocks,
    unbondingFeeSat: testnetStakingParams.unbonding_fee_sat,
    maxStakingAmountSat: testnetStakingParams.max_staking_value_sat,
    minStakingAmountSat: testnetStakingParams.min_staking_value_sat,
    maxStakingTimeBlocks: testnetStakingParams.max_staking_time_blocks,
    minStakingTimeBlocks: testnetStakingParams.min_staking_time_blocks,
    slashing: {
      slashingPkScriptHex: Buffer.from(testnetStakingParams.slashing_pk_script, 'base64').toString('hex'),
      slashingRate: parseFloat(testnetStakingParams.slashing_rate),
      minSlashingTxFeeSat: testnetStakingParams.min_slashing_tx_fee_sat,
    },
  };
}

type WithFee<T> = T & { fee: number };
type TransactionWithFee = WithFee<{ transaction: bitcoinjslib.Transaction }>;
type PsbtWithFee = WithFee<{ psbt: bitcoinjslib.Psbt }>;

type TransactionTree = {
  staking: TransactionWithFee;
  stakingWithdraw: PsbtWithFee;

  unbonding: TransactionWithFee;
  unbondingWithdraw: PsbtWithFee;
  unbondingSlashing: PsbtWithFee;
  unbondingSlashingWithdraw: PsbtWithFee | undefined;

  slashing: PsbtWithFee;
  slashingWithdraw: PsbtWithFee | undefined;
};

function getStakingTransactionTreeVendor(
  builder: vendor.Staking,
  amount: number,
  utxos: vendor.UTXO[],
  feeRateSatB: number,
  signers:
    | {
        staker: ECPairInterface;
        finalityProvider: ECPairInterface;
        covenant: ECPairInterface[];
        covenantThreshold: number;
      }
    | undefined,
  descriptorBuilder: BabylonDescriptorBuilder
): TransactionTree {
  const staking = builder.createStakingTransaction(amount, utxos, feeRateSatB);
  const stakingWithdraw = builder.createWithdrawStakingExpiredPsbt(staking.transaction, feeRateSatB);
  const unbonding = builder.createUnbondingTransaction(staking.transaction);
  const unbondingWithdraw = builder.createWithdrawEarlyUnbondedTransaction(unbonding.transaction, feeRateSatB);
  const unbondingSlashing = builder.createUnbondingOutputSlashingPsbt(unbonding.transaction);
  const signSequence = signers ? [signers.staker, signers.finalityProvider, ...signers.covenant] : undefined;
  const unbondingSlashingWithdraw = signSequence
    ? builder.createWithdrawSlashingPsbt(
        getSignedPsbt(unbondingSlashing.psbt, descriptorBuilder.getUnbondingDescriptor(), signSequence, {
          finalize: true,
        }).extractTransaction(),
        feeRateSatB
      )
    : undefined;
  const slashing = builder.createStakingOutputSlashingPsbt(staking.transaction);
  const slashingWithdraw = signSequence
    ? builder.createWithdrawSlashingPsbt(
        getSignedPsbt(slashing.psbt, descriptorBuilder.getStakingDescriptor(), signSequence, {
          finalize: true,
        }).extractTransaction(),
        feeRateSatB
      )
    : undefined;

  return {
    staking,
    stakingWithdraw,
    unbonding,
    unbondingWithdraw,
    unbondingSlashing,
    unbondingSlashingWithdraw,
    slashing,
    slashingWithdraw,
  };
}

function getTestnetStakingParamsWithCovenant(covenantKeys: ECPairInterface[]): vendor.VersionedStakingParams {
  return {
    ...getTestnetStakingParams(),
    covenantNoCoordPks: covenantKeys.map((pk) => getXOnlyPubkey(pk).toString('hex')),
  };
}

function wpkhDescriptor(key: utxolib.ECPairInterface): Descriptor {
  return Descriptor.fromString(ast.formatNode({ wpkh: key.publicKey.toString('hex') }), 'definite');
}

function mockUtxo(descriptor: Descriptor): vendor.UTXO {
  const scriptPubKey = Buffer.from(descriptor.scriptPubkey());
  const witnessScript = Buffer.from(descriptor.encode());
  return {
    rawTxHex: undefined,
    txid: Buffer.alloc(32).fill(0x11).toString('hex'),
    value: 666_666,
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
  value = normalize(value);
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
  await assertEqualsFixture(fixtureName, normalize(tx));
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

function describeWithKeys(
  tag: string,
  finalityProviderKeys: ECPairInterface[],
  covenantKeys: ECPairInterface[],
  stakingParams: vendor.VersionedStakingParams,
  { signIntermediateTxs = false } = {}
) {
  const stakerKey = getECKey('staker');
  const covenantThreshold = stakingParams.covenantQuorum;
  const stakingTimelock = stakingParams.minStakingTimeBlocks;
  const unbondingTimelock = stakingParams.unbondingTime;
  const vendorBuilder = new vendor.StakingScriptData(
    getXOnlyPubkey(stakerKey),
    finalityProviderKeys.map(getXOnlyPubkey),
    covenantKeys.map(getXOnlyPubkey),
    covenantThreshold,
    stakingTimelock,
    unbondingTimelock
  );

  const descriptorBuilder = new BabylonDescriptorBuilder(
    getXOnlyPubkey(stakerKey),
    finalityProviderKeys.map(getXOnlyPubkey),
    covenantKeys.map(getXOnlyPubkey),
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
        vendor.deriveStakingOutputInfo(vendorBuilder.buildScripts(), bitcoinjslib.networks.bitcoin),
        descriptorBuilder.getStakingDescriptor()
      );
      assertEqualOutputScript(
        vendor.deriveSlashingOutput(vendorBuilder.buildScripts(), bitcoinjslib.networks.bitcoin),
        descriptorBuilder.getSlashingDescriptor()
      );
      assertEqualOutputScript(
        vendor.deriveUnbondingOutputInfo(vendorBuilder.buildScripts(), bitcoinjslib.networks.bitcoin),
        descriptorBuilder.getUnbondingDescriptor()
      );
    });

    describe('Transaction Sets', async function () {
      const stakerMainWalletKey = getECKey('stakerMainWallet');
      const mainWallet = wpkhDescriptor(stakerMainWalletKey);
      const amount = 55_555;
      const changeAddress = createAddressFromDescriptor(mainWallet, undefined, utxolib.networks.bitcoin);
      const feeRateSatB = 2;
      const utxo = mockUtxo(mainWallet);

      it('has expected transactions', async function () {
        const stakingTx = vendor.stakingTransaction(
          vendorBuilder.buildScripts(),
          amount,
          changeAddress,
          [mockUtxo(mainWallet)],
          bitcoinjslib.networks.bitcoin,
          feeRateSatB
        );
        await assertTransactionEqualsFixture(`test/fixtures/babylon/stakingTransaction.${tag}.json`, stakingTx);

        // simply one staking output and one change output
        // nothing special
        assert.deepStrictEqual(stakingTx.transaction.outs, [
          {
            script: Buffer.from(descriptorBuilder.getStakingDescriptor().scriptPubkey()),
            value: amount,
          },
          {
            script: utxolib.address.toOutputScript(changeAddress, utxolib.networks.bitcoin),
            value: utxo.value - amount - stakingTx.fee,
          },
        ]);
      });

      if (finalityProviderKeys.length !== 1) {
        return;
      }

      const finalityProvider = finalityProviderKeys[0];

      it('has expected transactions (vendorStaking.Staking)', async function (this: Mocha.Context) {
        const vendorStakingTxBuilder = new vendor.Staking(
          bitcoinjslib.networks.bitcoin,
          {
            address: changeAddress,
            publicKeyNoCoordHex: getXOnlyPubkey(stakerKey).toString('hex'),
          },
          stakingParams,
          getXOnlyPubkey(finalityProvider).toString('hex'),
          stakingParams.minStakingTimeBlocks
        );

        const txTree = getStakingTransactionTreeVendor(
          vendorStakingTxBuilder,
          amount,
          [utxo],
          feeRateSatB,
          signIntermediateTxs
            ? {
                staker: stakerKey,
                finalityProvider,
                covenant: covenantKeys,
                covenantThreshold: covenantThreshold,
              }
            : undefined,
          descriptorBuilder
        );
        await assertTransactionEqualsFixture(`test/fixtures/babylon/txTree.${tag}.json`, txTree);
      });

      it('creates MsgCreateBTCDelegation', async function () {
        type F = typeof getVendorMsgCreateBtcDelegation;
        const fVendor: F = getVendorMsgCreateBtcDelegation;
        const fBitGo: F = getBitGoUtxoStakingMsgCreateBtcDelegation;

        for (const f of [fVendor, fBitGo]) {
          await assertEqualsFixture(
            `test/fixtures/babylon/msgCreateBTCDelegation.${tag}.json`,
            await f(
              bitcoinjslib.networks.bitcoin,
              stakerKey,
              finalityProvider,
              descriptorBuilder,
              stakingParams,
              changeAddress,
              amount,
              utxo,
              feeRateSatB
            )
          );
        }
      });
    });
  });
}

function describeWithKeysFromStakingParams(
  tag: string,
  finalityProviderKeys: ECPairInterface[],
  stakingParams: vendor.VersionedStakingParams
) {
  describeWithKeys(
    tag,
    finalityProviderKeys,
    stakingParams.covenantNoCoordPks.map((pk) => fromXOnlyPublicKey(Buffer.from(pk, 'hex'))),
    stakingParams
  );
}

function describeWithMockKeys(tag: string, finalityProviderKeys: ECPairInterface[], covenantKeys: ECPairInterface[]) {
  describeWithKeys(tag, finalityProviderKeys, covenantKeys, getTestnetStakingParamsWithCovenant(covenantKeys), {
    signIntermediateTxs: true,
  });
}

describeWithKeysFromStakingParams('testnet', [fromXOnlyPublicKey(finalityBabylonProvider0)], getTestnetStakingParams());
describeWithMockKeys('testnetMock', getECKeys('finalityProvider', 1), getECKeys('covenant', 9));
