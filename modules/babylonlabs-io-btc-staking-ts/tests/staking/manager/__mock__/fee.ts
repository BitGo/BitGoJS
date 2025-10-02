import {
  getPublicKeyNoCoord,
  VersionedStakingParams,
  type UTXO,
} from "../../../../src";

export const stakerInfo = {
  publicKeyNoCoordHex: getPublicKeyNoCoord(
    "0874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0c",
  ),
  address: "tb1plqg44wluw66vpkfccz23rdmtlepnx2m3yef57yyz66flgxdf4h8q7wu6pf",
};

export const stakerInfoArr = [
  // Taproot
  stakerInfo,
  // Native SegWit
  {
    publicKeyNoCoordHex: getPublicKeyNoCoord(
      "03d6781c8e9ac6fd353e97997d90befa0882c3e027a72ab12afaba5c391e5a87",
    ),
    address: "tb1qlphktyz6sse3meq36pjwjrsqktny4553paydg2",
  },
  // Legacy
  {
    publicKeyNoCoordHex: getPublicKeyNoCoord(
      "028333358d13582af186073cb3ad86c34630c186d7490603c4ce60fb51221c9a37",
    ),
    address: "msSV7NptGswtM4k7Qom6f9efJ2rcZQQ8Ho",
  },
];

export const babylonAddress = "bbn1cyqgpk0nlsutlm5ymkfpya30fqntanc8slpure";

export const stakingInput = {
  stakingAmountSat: 500_000,
  finalityProviderPksNoCoordHex: [
    getPublicKeyNoCoord(
      "d23c2c25e1fcf8fd1c21b9a402c19e2e309e531e45e92fb1e9805b6056b0cc76",
    ),
  ],
  stakingTimelock: 64000,
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

export const btcTipHeight = 900_000;
export const invalidStartHeightArr = [
  [0, "Babylon BTC tip height cannot be 0"],
  [200_000, "Babylon params not found for height 200000"],
] as [number, string][];

export const feeRate = 4;

export const stakingParams: VersionedStakingParams[] = [
  {
    version: 0,
    covenant_pks: [
      "d45c70d28f169e1f0c7f4a78e2bc73497afe585b70aa897955989068f3350aaa",
      "4b15848e495a3a62283daaadb3f458a00859fe48e321f0121ebabbdd6698f9fa",
      "23b29f89b45f4af41588dcaf0ca572ada32872a88224f311373917f1b37d08d1",
      "d3c79b99ac4d265c2f97ac11e3232c07a598b020cf56c6f055472c893c0967ae",
      "8242640732773249312c47ca7bdb50ca79f15f2ecc32b9c83ceebba44fb74df7",
      "e36200aaa8dce9453567bba108bdc51f7f1174b97a65e4dc4402fc5de779d41c",
      "cbdd028cfe32c1c1f2d84bfec71e19f92df509bba7b8ad31ca6c1a134fe09204",
      "f178fcce82f95c524b53b077e6180bd2d779a9057fdff4255a0af95af918cee0",
      "de13fc96ea6899acbdc5db3afaa683f62fe35b60ff6eb723dad28a11d2b12f8c",
    ],
    covenant_quorum: 6,
    min_staking_value_sat: 500000,
    max_staking_value_sat: 5000000,
    min_staking_time_blocks: 64000,
    max_staking_time_blocks: 64000,
    slashing_pk_script: "6a07626162796c6f6e",
    min_slashing_tx_fee_sat: 100000,
    slashing_rate: "0.001000000000000000",
    unbonding_time_blocks: 1008,
    unbonding_fee_sat: 64000,
    min_commission_rate: "0.030000000000000000",
    max_active_finality_providers: 0,
    delegation_creation_base_gas_fee: 1095000,
    allow_list_expiration_height: 139920,
    btc_activation_height: 857910,
  },
  {
    version: 1,
    covenant_pks: [
      "d45c70d28f169e1f0c7f4a78e2bc73497afe585b70aa897955989068f3350aaa",
      "4b15848e495a3a62283daaadb3f458a00859fe48e321f0121ebabbdd6698f9fa",
      "23b29f89b45f4af41588dcaf0ca572ada32872a88224f311373917f1b37d08d1",
      "d3c79b99ac4d265c2f97ac11e3232c07a598b020cf56c6f055472c893c0967ae",
      "8242640732773249312c47ca7bdb50ca79f15f2ecc32b9c83ceebba44fb74df7",
      "e36200aaa8dce9453567bba108bdc51f7f1174b97a65e4dc4402fc5de779d41c",
      "cbdd028cfe32c1c1f2d84bfec71e19f92df509bba7b8ad31ca6c1a134fe09204",
      "f178fcce82f95c524b53b077e6180bd2d779a9057fdff4255a0af95af918cee0",
      "de13fc96ea6899acbdc5db3afaa683f62fe35b60ff6eb723dad28a11d2b12f8c",
    ],
    covenant_quorum: 6,
    min_staking_value_sat: 500000,
    max_staking_value_sat: 50000000000,
    min_staking_time_blocks: 64000,
    max_staking_time_blocks: 64000,
    slashing_pk_script: "6a07626162796c6f6e",
    min_slashing_tx_fee_sat: 100000,
    slashing_rate: "0.001000000000000000",
    unbonding_time_blocks: 1008,
    unbonding_fee_sat: 32000,
    min_commission_rate: "0.030000000000000000",
    max_active_finality_providers: 0,
    delegation_creation_base_gas_fee: 1095000,
    allow_list_expiration_height: 139920,
    btc_activation_height: 864790,
  },
  {
    version: 2,
    covenant_pks: [
      "d45c70d28f169e1f0c7f4a78e2bc73497afe585b70aa897955989068f3350aaa",
      "4b15848e495a3a62283daaadb3f458a00859fe48e321f0121ebabbdd6698f9fa",
      "23b29f89b45f4af41588dcaf0ca572ada32872a88224f311373917f1b37d08d1",
      "d3c79b99ac4d265c2f97ac11e3232c07a598b020cf56c6f055472c893c0967ae",
      "8242640732773249312c47ca7bdb50ca79f15f2ecc32b9c83ceebba44fb74df7",
      "e36200aaa8dce9453567bba108bdc51f7f1174b97a65e4dc4402fc5de779d41c",
      "cbdd028cfe32c1c1f2d84bfec71e19f92df509bba7b8ad31ca6c1a134fe09204",
      "f178fcce82f95c524b53b077e6180bd2d779a9057fdff4255a0af95af918cee0",
      "de13fc96ea6899acbdc5db3afaa683f62fe35b60ff6eb723dad28a11d2b12f8c",
    ],
    covenant_quorum: 6,
    min_staking_value_sat: 500000,
    max_staking_value_sat: 500000000000,
    min_staking_time_blocks: 64000,
    max_staking_time_blocks: 64000,
    slashing_pk_script: "6a07626162796c6f6e",
    min_slashing_tx_fee_sat: 100000,
    slashing_rate: "0.001000000000000000",
    unbonding_time_blocks: 1008,
    unbonding_fee_sat: 32000,
    min_commission_rate: "0.030000000000000000",
    max_active_finality_providers: 0,
    delegation_creation_base_gas_fee: 1095000,
    allow_list_expiration_height: 139920,
    btc_activation_height: 874088,
  },
  {
    version: 3,
    covenant_pks: [
      "d45c70d28f169e1f0c7f4a78e2bc73497afe585b70aa897955989068f3350aaa",
      "4b15848e495a3a62283daaadb3f458a00859fe48e321f0121ebabbdd6698f9fa",
      "23b29f89b45f4af41588dcaf0ca572ada32872a88224f311373917f1b37d08d1",
      "d3c79b99ac4d265c2f97ac11e3232c07a598b020cf56c6f055472c893c0967ae",
      "8242640732773249312c47ca7bdb50ca79f15f2ecc32b9c83ceebba44fb74df7",
      "e36200aaa8dce9453567bba108bdc51f7f1174b97a65e4dc4402fc5de779d41c",
      "f178fcce82f95c524b53b077e6180bd2d779a9057fdff4255a0af95af918cee0",
      "de13fc96ea6899acbdc5db3afaa683f62fe35b60ff6eb723dad28a11d2b12f8c",
      "cbdd028cfe32c1c1f2d84bfec71e19f92df509bba7b8ad31ca6c1a134fe09204",
    ],
    covenant_quorum: 6,
    min_staking_value_sat: 500000,
    max_staking_value_sat: 500000000000,
    min_staking_time_blocks: 64000,
    max_staking_time_blocks: 64000,
    slashing_pk_script: "6a07626162796c6f6e",
    min_slashing_tx_fee_sat: 100000,
    slashing_rate: "0.001000000000000000",
    unbonding_time_blocks: 1008,
    unbonding_fee_sat: 32000,
    min_commission_rate: "0.030000000000000000",
    max_active_finality_providers: 0,
    delegation_creation_base_gas_fee: 1095000,
    allow_list_expiration_height: 139920,
    btc_activation_height: 891425,
  },
  {
    version: 4,
    covenant_pks: [
      "d45c70d28f169e1f0c7f4a78e2bc73497afe585b70aa897955989068f3350aaa",
      "4b15848e495a3a62283daaadb3f458a00859fe48e321f0121ebabbdd6698f9fa",
      "23b29f89b45f4af41588dcaf0ca572ada32872a88224f311373917f1b37d08d1",
      "d3c79b99ac4d265c2f97ac11e3232c07a598b020cf56c6f055472c893c0967ae",
      "8242640732773249312c47ca7bdb50ca79f15f2ecc32b9c83ceebba44fb74df7",
      "e36200aaa8dce9453567bba108bdc51f7f1174b97a65e4dc4402fc5de779d41c",
      "f178fcce82f95c524b53b077e6180bd2d779a9057fdff4255a0af95af918cee0",
      "de13fc96ea6899acbdc5db3afaa683f62fe35b60ff6eb723dad28a11d2b12f8c",
      "cbdd028cfe32c1c1f2d84bfec71e19f92df509bba7b8ad31ca6c1a134fe09204",
    ],
    covenant_quorum: 6,
    min_staking_value_sat: 500000,
    max_staking_value_sat: 500000000000,
    min_staking_time_blocks: 64000,
    max_staking_time_blocks: 64000,
    slashing_pk_script: "6a07626162796c6f6e",
    min_slashing_tx_fee_sat: 100000,
    slashing_rate: "0.001000000000000000",
    unbonding_time_blocks: 1008,
    unbonding_fee_sat: 9600,
    min_commission_rate: "0.030000000000000000",
    max_active_finality_providers: 0,
    delegation_creation_base_gas_fee: 1095000,
    allow_list_expiration_height: 139920,
    btc_activation_height: 893362,
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
