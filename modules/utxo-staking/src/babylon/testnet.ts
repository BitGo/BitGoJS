import { BIP32Interface } from '@bitgo/utxo-lib';

import { BabylonDescriptorBuilder } from './descriptor';

// Source: https://github.com/babylonlabs-io/babylon/blob/v1.99.0-snapshot.250211/app/upgrades/v1/testnet/btcstaking_params.go#L149-L159
export const testnetStakingParams = {
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

// Source: https://btcstaking.testnet.babylonlabs.io/ "Babylon Foundation 0"
export const finalityBabylonProvider0 = Buffer.from(
  'd23c2c25e1fcf8fd1c21b9a402c19e2e309e531e45e92fb1e9805b6056b0cc76',
  'hex'
);

export function getTestnetDescriptorBuilder(
  userKey: BIP32Interface,
  {
    finalityProviderKeys = [finalityBabylonProvider0],
  }: {
    finalityProviderKeys?: Buffer[];
  } = {}
): BabylonDescriptorBuilder {
  return new BabylonDescriptorBuilder(
    userKey.publicKey,
    finalityProviderKeys,
    testnetStakingParams.covenant_pks.map((pk) => Buffer.from(pk, 'hex')),
    testnetStakingParams.covenant_quorum,
    testnetStakingParams.min_staking_time_blocks,
    testnetStakingParams.unbonding_time_blocks
  );
}
