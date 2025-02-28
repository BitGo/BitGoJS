import assert from 'assert';

import * as bitcoinjslib from 'bitcoinjs-lib';
import * as utxolib from '@bitgo/utxo-lib';
import { ECPairInterface } from '@bitgo/utxo-lib';
import { ast, Descriptor, Miniscript } from '@bitgo/wasm-miniscript';
import { createAddressFromDescriptor, toWrappedPsbt } from '@bitgo/utxo-core/descriptor';
import { getFixture, getKey, toPlainObject } from '@bitgo/utxo-core/testutil';

import { BabylonDescriptorBuilder, finalityBabylonProvider0, testnetStakingParams } from '../../../src/babylon';

import * as vendor from './vendor/btc-staking-ts/src';
import * as vendorStaking from './vendor/btc-staking-ts/src/staking';
import * as vendorUtilsStaking from './vendor/btc-staking-ts/src/utils/staking';

bitcoinjslib.initEccLib(utxolib.ecc);

function getECKey(seed: string): ECPairInterface {
  const { privateKey } = getKey(seed);
  assert(privateKey);
  return utxolib.ECPair.fromPrivateKey(privateKey);
}

function getECKeys(key: string, count: number): ECPairInterface[] {
  return Array.from({ length: count }, (_, i) => getECKey(`${key}${i}`));
}

function getXOnlyPubkey(key: ECPairInterface): Buffer {
  return key.publicKey.subarray(1);
}

function fromXOnlyPublicKey(key: Buffer): ECPairInterface {
  for (const prefix of [0x02, 0x03]) {
    try {
      return utxolib.ECPair.fromPublicKey(Buffer.concat([Buffer.from([prefix]), key]));
    } catch {
      continue;
    }
  }
  throw new Error('Invalid x-only public key');
}

function getTestnetStakingParams(): vendor.StakingParams {
  return {
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

function getSigned(
  psbt: bitcoinjslib.Psbt,
  descriptor: Descriptor,
  signers: ECPairInterface[]
): bitcoinjslib.Transaction {
  const wrappedPsbt = toWrappedPsbt(psbt.toBuffer());
  const signedInputs = psbt.data.inputs.flatMap((input, i) => {
    assert(input.witnessUtxo);
    if (Buffer.from(descriptor.scriptPubkey()).equals(input.witnessUtxo.script)) {
      wrappedPsbt.updateInputWithDescriptor(i, descriptor);
      const signResults = signers.map((signer) => {
        assert(signer.privateKey);
        return wrappedPsbt.signWithPrv(signer.privateKey);
      });
      return [[i, signResults]];
    }
    return [];
  });
  assert(signedInputs.length > 0);
  wrappedPsbt.finalize();
  return bitcoinjslib.Psbt.fromBuffer(Buffer.from(wrappedPsbt.serialize())).extractTransaction();
}

function getStakingTransactionTreeVendor(
  builder: vendorStaking.Staking,
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
        getSigned(unbondingSlashing.psbt, descriptorBuilder.getUnbondingDescriptor(), signSequence),
        feeRateSatB
      )
    : undefined;
  const slashing = builder.createStakingOutputSlashingPsbt(staking.transaction);
  const slashingWithdraw = signSequence
    ? builder.createWithdrawSlashingPsbt(
        getSigned(slashing.psbt, descriptorBuilder.getStakingDescriptor(), signSequence),
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

function getTestnetStakingParamsWithCovenant(covenantKeys: ECPairInterface[]): vendor.StakingParams {
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

function describeWithKeys(
  tag: string,
  finalityProviderKeys: ECPairInterface[],
  covenantKeys: ECPairInterface[],
  stakingParams: vendor.StakingParams,
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

      it('has expected transactions (vendorStaking.Staking)', async function (this: Mocha.Context) {
        if (finalityProviderKeys.length !== 1) {
          this.skip();
        }

        const finalityProvider = finalityProviderKeys[0];

        const vendorStakingTxBuilder = new vendorStaking.Staking(
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
    });
  });
}

function describeWithKeysFromStakingParams(
  tag: string,
  finalityProviderKeys: ECPairInterface[],
  stakingParams: vendor.StakingParams
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
