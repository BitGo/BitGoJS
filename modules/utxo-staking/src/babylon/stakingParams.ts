import { BIP32Interface, ECPairInterface } from '@bitgo/utxo-lib';
import { StakerInfo, StakingInputs, VersionedStakingParams } from '@bitgo/babylonlabs-io-btc-staking-ts';

import { BabylonDescriptorBuilder } from './descriptor';

export type JsonParams = {
  version: number;
  covenant_pks: string[];
  covenant_quorum: number;
  min_staking_value_sat: number;
  max_staking_value_sat: number;
  min_staking_time_blocks: number;
  max_staking_time_blocks: number;
  slashing_pk_script: string;
  min_slashing_tx_fee_sat: number;
  slashing_rate: string;
  unbonding_time_blocks: number;
  unbonding_fee_sat: number;
  min_commission_rate: string;
  delegation_creation_base_gas_fee: number;
  allow_list_expiration_height: number;
  btc_activation_height: number;
};

// Source: https://github.com/babylonlabs-io/babylon/blob/v1.99.0-snapshot.250211/app/upgrades/v1/testnet/btcstaking_params.go#L149-L159
export const testnetStakingParams: JsonParams = {
  version: 5 /* it's the sixth element in the array */,
  covenant_pks: [
    'fa9d882d45f4060bdb8042183828cd87544f1ea997380e586cab77d5fd698737',
    '0aee0509b16db71c999238a4827db945526859b13c95487ab46725357c9a9f25',
    '17921cf156ccb4e73d428f996ed11b245313e37e27c978ac4d2cc21eca4672e4',
    '113c3a32a9d320b72190a04a020a0db3976ef36972673258e9a38a364f3dc3b0',
    '79a71ffd71c503ef2e2f91bccfc8fcda7946f4653cef0d9f3dde20795ef3b9f0',
    '3bb93dfc8b61887d771f3630e9a63e97cbafcfcc78556a474df83a31a0ef899c',
    'd21faf78c6751a0d38e6bd8028b907ff07e9a869a43fc837d6b3f8dff6119a36',
    '40afaf47c4ffa56de86410d8e47baa2bb6f04b604f4ea24323737ddc3fe092df',
    'f5199efae3f28bb82476163a7e458c7ad445d9bffb0682d10d3bdb2cb41f8e8e',
  ],
  covenant_quorum: 6,
  min_staking_value_sat: 50000,
  max_staking_value_sat: 35000000000,
  min_staking_time_blocks: 10000,
  max_staking_time_blocks: 64000,
  slashing_pk_script: 'ABRb4SYk0IorQkCV18ByIcM0UNFL8Q==',
  min_slashing_tx_fee_sat: 5000,
  slashing_rate: '0.05',
  unbonding_time_blocks: 1008,
  unbonding_fee_sat: 2000,
  min_commission_rate: '0.03',
  delegation_creation_base_gas_fee: 1095000,
  allow_list_expiration_height: 26124,
  btc_activation_height: 227174,
};

// https://github.com/babylonlabs-io/babylon/blob/v1.99.0-snapshot.250211/app/upgrades/v1/mainnet/btcstaking_params.go#L4-L28
export const mainnetStakingParams: JsonParams = {
  version: 0,
  covenant_pks: [
    '43311589af63c2adda04fcd7792c038a05c12a4fe40351b3eb1612ff6b2e5a0e',
    'd415b187c6e7ce9da46ac888d20df20737d6f16a41639e68ea055311e1535dd9',
    'd27cd27dbff481bc6fc4aa39dd19405eb6010237784ecba13bab130a4a62df5d',
    'a3e107fee8879f5cf901161dbf4ff61c252ba5fec6f6407fe81b9453d244c02c',
    'c45753e856ad0abb06f68947604f11476c157d13b7efd54499eaa0f6918cf716',
  ],
  covenant_quorum: 3,
  min_staking_value_sat: 10000,
  max_staking_value_sat: 10000000000,
  min_staking_time_blocks: 10,
  max_staking_time_blocks: 65535,
  slashing_pk_script: 'dqkUAQEBAQEBAQEBAQEBAQEBAQEBAQGIrA==',
  min_slashing_tx_fee_sat: 1000,
  slashing_rate: '0.100000000000000000',
  unbonding_time_blocks: 101,
  unbonding_fee_sat: 1000,
  min_commission_rate: '0.03',
  delegation_creation_base_gas_fee: 1000,
  allow_list_expiration_height: 0,
  btc_activation_height: 100,
};

export function toVersionedParams(p: JsonParams): VersionedStakingParams {
  return {
    version: p.version,
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
  };
}

// Source: https://btcstaking.testnet.babylonlabs.io/ "Babylon Foundation 0"
export const testnetFinalityProvider0 = Buffer.from(
  'd23c2c25e1fcf8fd1c21b9a402c19e2e309e531e45e92fb1e9805b6056b0cc76',
  'hex'
);

export function getDescriptorBuilderForParams(
  userKey: BIP32Interface | ECPairInterface | Buffer,
  finalityProviderKeys: Buffer[],
  params: Pick<
    VersionedStakingParams,
    'covenantNoCoordPks' | 'covenantQuorum' | 'minStakingTimeBlocks' | 'unbondingTime'
  >
): BabylonDescriptorBuilder {
  if (!Buffer.isBuffer(userKey)) {
    userKey = userKey.publicKey;
  }
  return new BabylonDescriptorBuilder(
    userKey,
    finalityProviderKeys,
    params.covenantNoCoordPks.map((pk) => Buffer.from(pk, 'hex')),
    params.covenantQuorum,
    params.minStakingTimeBlocks,
    params.unbondingTime
  );
}

export function getDescriptorProviderForStakingParams(
  stakerBtcInfo: StakerInfo,
  stakingInput: StakingInputs,
  stakingParams: VersionedStakingParams
): BabylonDescriptorBuilder {
  const userKey = Buffer.from(stakerBtcInfo.publicKeyNoCoordHex, 'hex');
  const finalityProviderKey = Buffer.from(stakingInput.finalityProviderPkNoCoordHex, 'hex');
  return getDescriptorBuilderForParams(userKey, [finalityProviderKey], stakingParams);
}

export function getTestnetDescriptorBuilder(
  userKey: BIP32Interface | ECPairInterface | Buffer,
  {
    finalityProviderKeys = [testnetFinalityProvider0],
  }: {
    finalityProviderKeys?: Buffer[];
  } = {}
): BabylonDescriptorBuilder {
  return getDescriptorBuilderForParams(userKey, finalityProviderKeys, toVersionedParams(testnetStakingParams));
}
