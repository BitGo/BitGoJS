import * as t from 'io-ts';
import * as tt from 'io-ts-types';
import { isLeft } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';
import * as utxolib from '@bitgo/utxo-lib';
import {
  getBabylonParamByVersion,
  StakerInfo,
  StakingInputs,
  StakingParams,
  VersionedStakingParams,
} from '@bitgo/babylonlabs-io-btc-staking-ts';
export { getBabylonParamByVersion, getBabylonParamByBtcHeight } from '@bitgo/babylonlabs-io-btc-staking-ts';

import { BabylonDescriptorBuilder } from './descriptor';
import jsonMainnetParams from './params.mainnet.json';
import jsonTestnetParams from './params.testnet.json';
import { BabylonNetworkLike, toBabylonNetwork } from './network';

/** @see https://docs.babylonlabs.io/api/babylon-gRPC/params/ */
const BabylonParamsJSON = t.type({
  covenant_pks: t.array(t.string),
  covenant_quorum: t.number,
  min_staking_value_sat: tt.NumberFromString,
  max_staking_value_sat: tt.NumberFromString,
  min_staking_time_blocks: t.number,
  max_staking_time_blocks: t.number,
  slashing_pk_script: t.string,
  min_slashing_tx_fee_sat: tt.NumberFromString,
  slashing_rate: t.string,
  unbonding_time_blocks: t.number,
  unbonding_fee_sat: tt.NumberFromString,
  min_commission_rate: tt.NumberFromString,
  delegation_creation_base_gas_fee: tt.NumberFromString,
  allow_list_expiration_height: tt.NumberFromString,
  btc_activation_height: t.number,
});

type BabylonParamsJSON = t.TypeOf<typeof BabylonParamsJSON>;

export function toVersionedParams(ps: BabylonParamsJSON[]): VersionedStakingParams[] {
  return ps.map((p, version) => ({
    version,
    btcActivationHeight: p.btc_activation_height,
    covenantNoCoordPks: p.covenant_pks,
    covenantQuorum: p.covenant_quorum,
    unbondingTime: p.unbonding_time_blocks,
    unbondingFeeSat: p.unbonding_fee_sat,
    maxStakingAmountSat: p.max_staking_value_sat,
    minStakingAmountSat: p.min_staking_value_sat,
    maxStakingTimeBlocks: p.max_staking_time_blocks,
    minStakingTimeBlocks: p.min_staking_time_blocks,
    slashing: {
      slashingPkScriptHex: Buffer.from(p.slashing_pk_script, 'base64').toString('hex'),
      slashingRate: parseFloat(p.slashing_rate),
      minSlashingTxFeeSat: p.min_slashing_tx_fee_sat,
    },
  }));
}

function toVersionedParamsFromJson(jsonParams: unknown[]): VersionedStakingParams[] {
  return toVersionedParams(
    jsonParams.map((p): BabylonParamsJSON => {
      const result = t.type({ params: BabylonParamsJSON }).decode(p);
      if (isLeft(result)) {
        const msg = PathReporter.report(result).join('\n');
        throw new Error(`Invalid params: ${msg}`);
      }
      return result.right.params;
    })
  );
}

export const mainnetStakingParams: readonly VersionedStakingParams[] = Object.freeze(
  toVersionedParamsFromJson(jsonMainnetParams)
);

export const testnetStakingParams: readonly VersionedStakingParams[] = Object.freeze(
  toVersionedParamsFromJson(jsonTestnetParams)
);

export function getStakingParams(network: BabylonNetworkLike): VersionedStakingParams[] {
  switch (toBabylonNetwork(network)) {
    case 'mainnet':
      return [...mainnetStakingParams];
    case 'testnet':
      return [...testnetStakingParams];
    default:
      throw new Error('Unsupported network');
  }
}

// Source: https://btcstaking.testnet.babylonlabs.io/ "Babylon Foundation 0"
export const testnetFinalityProvider0 = Buffer.from(
  'd23c2c25e1fcf8fd1c21b9a402c19e2e309e531e45e92fb1e9805b6056b0cc76',
  'hex'
);

type DescriptorStakingParams = Pick<
  StakingParams,
  'covenantNoCoordPks' | 'covenantQuorum' | 'minStakingTimeBlocks' | 'unbondingTime'
>;

export function getDescriptorBuilderForParams(
  userKey: utxolib.BIP32Interface | utxolib.ECPairInterface | Buffer,
  finalityProviderKeys: Buffer[],
  stakingTimelock: number,
  params: DescriptorStakingParams
): BabylonDescriptorBuilder {
  if (!Buffer.isBuffer(userKey)) {
    userKey = userKey.publicKey;
  }
  return new BabylonDescriptorBuilder(
    userKey,
    finalityProviderKeys,
    params.covenantNoCoordPks.map((pk) => Buffer.from(pk, 'hex')),
    params.covenantQuorum,
    stakingTimelock,
    params.unbondingTime
  );
}

export function getDescriptorProviderForStakingParams(
  stakerBtcInfo: Pick<StakerInfo, 'publicKeyNoCoordHex'>,
  stakingInput: StakingInputs,
  stakingParams: DescriptorStakingParams
): BabylonDescriptorBuilder {
  const userKey = Buffer.from(stakerBtcInfo.publicKeyNoCoordHex, 'hex');
  const finalityProviderKey = Buffer.from(stakingInput.finalityProviderPkNoCoordHex, 'hex');
  return getDescriptorBuilderForParams(userKey, [finalityProviderKey], stakingInput.stakingTimelock, stakingParams);
}

export function getTestnetDescriptorBuilder(
  userKey: utxolib.BIP32Interface | utxolib.ECPairInterface | Buffer,
  {
    finalityProviderKeys = [testnetFinalityProvider0],
    params = getBabylonParamByVersion(5, getStakingParams('testnet')),
    stakingTimelock = params.minStakingTimeBlocks,
  }: {
    finalityProviderKeys?: Buffer[];
    params?: StakingParams;
    stakingTimelock?: number;
  } = {}
): BabylonDescriptorBuilder {
  return getDescriptorBuilderForParams(userKey, finalityProviderKeys, stakingTimelock, params);
}
