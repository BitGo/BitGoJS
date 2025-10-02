import { getPublicKeyNoCoord, UTXO } from "../../../../src";

export const params = [
  {
    version: 0,
    covenant_pks: [
      "ffeaec52a9b407b355ef6967a7ffc15fd6c3fe07de2844d61550475e7a5233e5",
      "a5c60c2188e833d39d0fa798ab3f69aa12ed3dd2f3bad659effa252782de3c31",
      "59d3532148a597a2d05c0395bf5f7176044b1cd312f37701a9b4d0aad70bc5a4",
    ],
    covenant_quorum: 2,
    min_staking_value_sat: 10000,
    max_staking_value_sat: 1000000000000,
    min_staking_time_blocks: 100,
    max_staking_time_blocks: 60000,
    slashing_pk_script: "0014f87283ca2ab20a1ab50cc7cea290f722c9a24574",
    min_slashing_tx_fee_sat: 1000,
    slashing_rate: "0.100000000000000000",
    unbonding_time_blocks: 20,
    unbonding_fee_sat: 500,
    min_commission_rate: "0.050000000000000000",
    max_active_finality_providers: 0,
    delegation_creation_base_gas_fee: 1000000,
    allow_list_expiration_height: 1440,
    btc_activation_height: 222170,
  },
  {
    version: 1,
    covenant_pks: [
      "ffeaec52a9b407b355ef6967a7ffc15fd6c3fe07de2844d61550475e7a5233e5",
      "a5c60c2188e833d39d0fa798ab3f69aa12ed3dd2f3bad659effa252782de3c31",
      "59d3532148a597a2d05c0395bf5f7176044b1cd312f37701a9b4d0aad70bc5a4",
    ],
    covenant_quorum: 2,
    min_staking_value_sat: 10000,
    max_staking_value_sat: 100000,
    min_staking_time_blocks: 100,
    max_staking_time_blocks: 60000,
    slashing_pk_script: "0014f87283ca2ab20a1ab50cc7cea290f722c9a24574",
    min_slashing_tx_fee_sat: 1000,
    slashing_rate: "0.100000000000000000",
    unbonding_time_blocks: 20,
    unbonding_fee_sat: 500,
    min_commission_rate: "0.050000000000000000",
    max_active_finality_providers: 0,
    delegation_creation_base_gas_fee: 1000000,
    allow_list_expiration_height: 1440,
    btc_activation_height: 227443,
  },
  {
    version: 2,
    covenant_pks: [
      "ffeaec52a9b407b355ef6967a7ffc15fd6c3fe07de2844d61550475e7a5233e5",
      "a5c60c2188e833d39d0fa798ab3f69aa12ed3dd2f3bad659effa252782de3c31",
      "59d3532148a597a2d05c0395bf5f7176044b1cd312f37701a9b4d0aad70bc5a4",
    ],
    covenant_quorum: 2,
    min_staking_value_sat: 10000,
    max_staking_value_sat: 1000000000000,
    min_staking_time_blocks: 100,
    max_staking_time_blocks: 60000,
    slashing_pk_script: "0014f87283ca2ab20a1ab50cc7cea290f722c9a24574",
    min_slashing_tx_fee_sat: 1000,
    slashing_rate: "0.100000000000000000",
    unbonding_time_blocks: 5,
    unbonding_fee_sat: 500,
    min_commission_rate: "0.050000000000000000",
    max_active_finality_providers: 0,
    delegation_creation_base_gas_fee: 1000000,
    allow_list_expiration_height: 1440,
    btc_activation_height: 227490,
  },
].map((v) => ({
  version: v.version,
  covenantNoCoordPks: v.covenant_pks.map((pk) =>
    String(getPublicKeyNoCoord(pk)),
  ),
  covenantQuorum: v.covenant_quorum,
  minStakingValueSat: v.min_staking_value_sat,
  maxStakingValueSat: v.max_staking_value_sat,
  minStakingTimeBlocks: v.min_staking_time_blocks,
  maxStakingTimeBlocks: v.max_staking_time_blocks,
  unbondingTime: v.unbonding_time_blocks,
  unbondingFeeSat: v.unbonding_fee_sat,
  minCommissionRate: v.min_commission_rate,
  maxActiveFinalityProviders: v.max_active_finality_providers,
  delegationCreationBaseGasFee: v.delegation_creation_base_gas_fee,
  slashing: {
    slashingPkScriptHex: v.slashing_pk_script,
    slashingRate: parseFloat(v.slashing_rate),
    minSlashingTxFeeSat: v.min_slashing_tx_fee_sat,
  },
  maxStakingAmountSat: v.max_staking_value_sat,
  minStakingAmountSat: v.min_staking_value_sat,
  btcActivationHeight: v.btc_activation_height,
  allowListExpirationHeight: v.allow_list_expiration_height,
}));

export const stakerInfo = {
  publicKeyNoCoordHex: getPublicKeyNoCoord(
    "0874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0c",
  ),
  address: "tb1plqg44wluw66vpkfccz23rdmtlepnx2m3yef57yyz66flgxdf4h8q7wu6pf",
};

export const utxos: UTXO[] = [
  {
    scriptPubKey:
      "5120f8115abbfc76b4c0d938c09511b76bfe43332b7126534f1082d693f419a9adce",
    txid: "226a8c02e28ff47a8ea3e6cf2612768071ecb1c40e5b5a5ccc3bdc3e538d6dd6",
    value: 8586757,
    vout: 1,
  },
];
