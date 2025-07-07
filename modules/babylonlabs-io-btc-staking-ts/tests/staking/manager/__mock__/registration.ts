import { Transaction } from "bitcoinjs-lib";
import {
  getPublicKeyNoCoord,
  VersionedStakingParams,
  type UTXO,
} from "../../../../src";

export const params: VersionedStakingParams[] = [
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

export const stakerInfo = {
  publicKeyNoCoordHex: getPublicKeyNoCoord(
    "0874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0c",
  ),
  address: "tb1plqg44wluw66vpkfccz23rdmtlepnx2m3yef57yyz66flgxdf4h8q7wu6pf",
};

export const stakerInfoArr = [
  // Taproot
  [
    stakerInfo,
    {
      slashingPsbt:
        "70736274ff010070020000000197e5f77c011a657e5f3aa24d46c1b3e4949980a8e30b5d5555bfdbb929a7fae90000000000ffffffff02f401000000000000096a07626162796c6f6e8c180600000000002251208c4b66479c64625efc30e0bc53c7df68173d3a444fdc0847e6a3ae4de1ab6add000000000001012b20a1070000000000225120745e0394730bd20a0a790069eeb28b4da95f73ea1d121374a299d8da9cb6d0934215c150929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac07ffc89a815b7b26da44c800e92dcf548694fd65486abe250fb6f7b30b73b2286fd7901200874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0cad20d23c2c25e1fcf8fd1c21b9a402c19e2e309e531e45e92fb1e9805b6056b0cc76ad2023b29f89b45f4af41588dcaf0ca572ada32872a88224f311373917f1b37d08d1ac204b15848e495a3a62283daaadb3f458a00859fe48e321f0121ebabbdd6698f9faba208242640732773249312c47ca7bdb50ca79f15f2ecc32b9c83ceebba44fb74df7ba20cbdd028cfe32c1c1f2d84bfec71e19f92df509bba7b8ad31ca6c1a134fe09204ba20d3c79b99ac4d265c2f97ac11e3232c07a598b020cf56c6f055472c893c0967aeba20d45c70d28f169e1f0c7f4a78e2bc73497afe585b70aa897955989068f3350aaaba20de13fc96ea6899acbdc5db3afaa683f62fe35b60ff6eb723dad28a11d2b12f8cba20e36200aaa8dce9453567bba108bdc51f7f1174b97a65e4dc4402fc5de779d41cba20f178fcce82f95c524b53b077e6180bd2d779a9057fdff4255a0af95af918cee0ba569cc001172050929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0000000",
      unbondingSlashingPsbt:
        "70736274ff010070020000000151c1c42cbc4b725a5fa513ba3f10c1f6b5b6225f6446cd5ca61ea7e2e8dfdaea0000000000ffffffff02ea01000000000000096a07626162796c6f6e16f30500000000002251208c4b66479c64625efc30e0bc53c7df68173d3a444fdc0847e6a3ae4de1ab6add000000000001012ba07b070000000000225120655759c640a9d374e949e6e2cefdb6bee32e54b7dac9a0995fe508a04b3fd2cd4215c150929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0010700255627c84b08e73ce57938ce8e6b01de0613e3a9dbb7216e9095d9129cfd7901200874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0cad20d23c2c25e1fcf8fd1c21b9a402c19e2e309e531e45e92fb1e9805b6056b0cc76ad2023b29f89b45f4af41588dcaf0ca572ada32872a88224f311373917f1b37d08d1ac204b15848e495a3a62283daaadb3f458a00859fe48e321f0121ebabbdd6698f9faba208242640732773249312c47ca7bdb50ca79f15f2ecc32b9c83ceebba44fb74df7ba20cbdd028cfe32c1c1f2d84bfec71e19f92df509bba7b8ad31ca6c1a134fe09204ba20d3c79b99ac4d265c2f97ac11e3232c07a598b020cf56c6f055472c893c0967aeba20d45c70d28f169e1f0c7f4a78e2bc73497afe585b70aa897955989068f3350aaaba20de13fc96ea6899acbdc5db3afaa683f62fe35b60ff6eb723dad28a11d2b12f8cba20e36200aaa8dce9453567bba108bdc51f7f1174b97a65e4dc4402fc5de779d41cba20f178fcce82f95c524b53b077e6180bd2d779a9057fdff4255a0af95af918cee0ba569cc001172050929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0000000",
      stakingTxHex:
        "0200000001d66d8d533edc3bcc5c5a5b0ec4b1ec7180761226cfe6a38e7af48fe2028c6a220100000000ffffffff0220a1070000000000225120745e0394730bd20a0a790069eeb28b4da95f73ea1d121374a299d8da9cb6d09379627b0000000000225120f8115abbfc76b4c0d938c09511b76bfe43332b7126534f1082d693f419a9adce00000000",
      signType: "bip322-simple",
      signedBabylonAddress:
        "AUDG4E+rqWGwxtqAl3YuIY8vZ81qCbuLChpdQ7t0xxKpI8+TxXqeJzer8iNOtDbcKddhl8QDL5+1LQ70GsvEtF2t",
      signedSlashingPsbt:
        "70736274ff010070020000000197e5f77c011a657e5f3aa24d46c1b3e4949980a8e30b5d5555bfdbb929a7fae90000000000ffffffff02f401000000000000096a07626162796c6f6e8c180600000000002251208c4b66479c64625efc30e0bc53c7df68173d3a444fdc0847e6a3ae4de1ab6add000000000001012b20a1070000000000225120745e0394730bd20a0a790069eeb28b4da95f73ea1d121374a299d8da9cb6d0930108fdff0103400fceade8b5e88c87305dda3a821e93916a0295c32fd9ad87e8b60fddc931a6aea4a78c690c979489a52dff8185c984d3e3a41bcd017d9633b2f744adb567d7f6fd7801200874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0cad20d23c2c25e1fcf8fd1c21b9a402c19e2e309e531e45e92fb1e9805b6056b0cc76ad2023b29f89b45f4af41588dcaf0ca572ada32872a88224f311373917f1b37d08d1ac204b15848e495a3a62283daaadb3f458a00859fe48e321f0121ebabbdd6698f9faba208242640732773249312c47ca7bdb50ca79f15f2ecc32b9c83ceebba44fb74df7ba20cbdd028cfe32c1c1f2d84bfec71e19f92df509bba7b8ad31ca6c1a134fe09204ba20d3c79b99ac4d265c2f97ac11e3232c07a598b020cf56c6f055472c893c0967aeba20d45c70d28f169e1f0c7f4a78e2bc73497afe585b70aa897955989068f3350aaaba20de13fc96ea6899acbdc5db3afaa683f62fe35b60ff6eb723dad28a11d2b12f8cba20e36200aaa8dce9453567bba108bdc51f7f1174b97a65e4dc4402fc5de779d41cba20f178fcce82f95c524b53b077e6180bd2d779a9057fdff4255a0af95af918cee0ba569c41c150929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac07ffc89a815b7b26da44c800e92dcf548694fd65486abe250fb6f7b30b73b2286000000",
      signedUnbondingSlashingPsbt:
        "70736274ff010070020000000151c1c42cbc4b725a5fa513ba3f10c1f6b5b6225f6446cd5ca61ea7e2e8dfdaea0000000000ffffffff02ea01000000000000096a07626162796c6f6e16f30500000000002251208c4b66479c64625efc30e0bc53c7df68173d3a444fdc0847e6a3ae4de1ab6add000000000001012ba07b070000000000225120655759c640a9d374e949e6e2cefdb6bee32e54b7dac9a0995fe508a04b3fd2cd0108fdff01034042d62d7dc274006463429df97d6e633dc98ea77f09ac3ce49d487fe06ac5beae2899b451891580cfa5a68f227aa63d15995dce710d44918a47fd1220525393a4fd7801200874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0cad20d23c2c25e1fcf8fd1c21b9a402c19e2e309e531e45e92fb1e9805b6056b0cc76ad2023b29f89b45f4af41588dcaf0ca572ada32872a88224f311373917f1b37d08d1ac204b15848e495a3a62283daaadb3f458a00859fe48e321f0121ebabbdd6698f9faba208242640732773249312c47ca7bdb50ca79f15f2ecc32b9c83ceebba44fb74df7ba20cbdd028cfe32c1c1f2d84bfec71e19f92df509bba7b8ad31ca6c1a134fe09204ba20d3c79b99ac4d265c2f97ac11e3232c07a598b020cf56c6f055472c893c0967aeba20d45c70d28f169e1f0c7f4a78e2bc73497afe585b70aa897955989068f3350aaaba20de13fc96ea6899acbdc5db3afaa683f62fe35b60ff6eb723dad28a11d2b12f8cba20e36200aaa8dce9453567bba108bdc51f7f1174b97a65e4dc4402fc5de779d41cba20f178fcce82f95c524b53b077e6180bd2d779a9057fdff4255a0af95af918cee0ba569c41c150929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0010700255627c84b08e73ce57938ce8e6b01de0613e3a9dbb7216e9095d9129c000000",
      postStakingDelegationMsg: {
        stakerAddr: "bbn1cyqgpk0nlsutlm5ymkfpya30fqntanc8slpure",
        pop: {
          btcSigType: "BIP322",
          btcSig:
            "Cj50YjFwbHFnNDR3bHV3NjZ2cGtmY2N6MjNyZG10bGVwbngybTN5ZWY1N3l5ejY2ZmxneGRmNGg4cTd3dTZwZhJCAUDG4E+rqWGwxtqAl3YuIY8vZ81qCbuLChpdQ7t0xxKpI8+TxXqeJzer8iNOtDbcKddhl8QDL5+1LQ70GsvEtF2t",
        },
        btcPk: "CHSHYUf9dSLWF+g7+EX3+0mBUg48L3Sa1KLKG9Zg7ww=",
        fpBtcPkList: ["0jwsJeH8+P0cIbmkAsGeLjCeUx5F6S+x6YBbYFawzHY="],
        stakingTime: 64000,
        stakingValue: 500000,
        stakingTx:
          "AgAAAAHWbY1TPtw7zFxaWw7EsexxgHYSJs/mo4569I/iAoxqIgEAAAAA/////wIgoQcAAAAAACJRIHReA5RzC9IKCnkAae6yi02pX3PqHRITdKKZ2NqcttCTeWJ7AAAAAAAiUSD4EVq7/Ha0wNk4wJURt2v+QzMrcSZTTxCC1pP0GamtzgAAAAA=",
        stakingTxInclusionProof: {
          key: {
            index: 182,
            hash: "kFJzEOcdOpI/twNJ9K/qsIXWbu0TDYOkTV29bIIAAAA=",
          },
          proof:
            "QmFz1hg6euFbROHG0FJwspulsAUBYJu6xLvFjewWxGy5Fyv+TjCQ61lgUQ9mi99On/Q4WB7olRoeI7dOhn4Vh3012zkV3b5WFA30MfHfO2T9gnrQiX1JSEWEsDZec3ZszEU5baFuvcl9sZD3zxgNdoAneVZU6CMdp63+v7domlrHUlVKngByzPuMsm8u8kP/TwRQgBXVvo1CIz1kF4jK+bCU6cAX7HGRNWZGE6Crkwya/eD0EqPCQPprXAthsNT3Oor7O3XpqZN6oHX18lZ5uF8I4QAhIm3uHd2nooKVbFk88z29qYnut37DZr+CT7PlmoVZblKCf7E2xtixv6QEwGNXV2LEjQTtNsG7mdK+R4KMW6m/81JXEnPhGMIiEzof",
        },
        slashingTx:
          "AgAAAAGX5fd8ARplfl86ok1GwbPklJmAqOMLXVVVv9u5Kaf66QAAAAAA/////wL0AQAAAAAAAAlqB2JhYnlsb26MGAYAAAAAACJRIIxLZkecZGJe/DDgvFPH32gXPTpET9wIR+ajrk3hq2rdAAAAAA==",
        delegatorSlashingSig:
          "D86t6LXojIcwXdo6gh6TkWoClcMv2a2H6LYP3ckxpq6kp4xpDJeUiaUt/4GFyYTT46QbzQF9ljOy90SttWfX9g==",
        unbondingTime: 1008,
        unbondingTx:
          "AgAAAAGX5fd8ARplfl86ok1GwbPklJmAqOMLXVVVv9u5Kaf66QAAAAAA/////wGgewcAAAAAACJRIGVXWcZAqdN06Unm4s79tr7jLlS32smgmV/lCKBLP9LNAAAAAA==",
        unbondingValue: 490400,
        unbondingSlashingTx:
          "AgAAAAFRwcQsvEtyWl+lE7o/EMH2tbYiX2RGzVymHqfi6N/a6gAAAAAA/////wLqAQAAAAAAAAlqB2JhYnlsb24W8wUAAAAAACJRIIxLZkecZGJe/DDgvFPH32gXPTpET9wIR+ajrk3hq2rdAAAAAA==",
        delegatorUnbondingSlashingSig:
          "QtYtfcJ0AGRjQp35fW5jPcmOp38JrDzknUh/4GrFvq4ombRRiRWAz6WmjyJ6pj0VmV3OcQ1EkYpH/RIgUlOTpA==",
      },
      delegationMsg: {
        stakerAddr: "bbn1cyqgpk0nlsutlm5ymkfpya30fqntanc8slpure",
        pop: {
          btcSigType: "BIP322",
          btcSig:
            "Cj50YjFwbHFnNDR3bHV3NjZ2cGtmY2N6MjNyZG10bGVwbngybTN5ZWY1N3l5ejY2ZmxneGRmNGg4cTd3dTZwZhJCAUDG4E+rqWGwxtqAl3YuIY8vZ81qCbuLChpdQ7t0xxKpI8+TxXqeJzer8iNOtDbcKddhl8QDL5+1LQ70GsvEtF2t",
        },
        btcPk: "CHSHYUf9dSLWF+g7+EX3+0mBUg48L3Sa1KLKG9Zg7ww=",
        fpBtcPkList: ["0jwsJeH8+P0cIbmkAsGeLjCeUx5F6S+x6YBbYFawzHY="],
        stakingTime: 64000,
        stakingValue: 500000,
        stakingTx:
          "AgAAAAHWbY1TPtw7zFxaWw7EsexxgHYSJs/mo4569I/iAoxqIgEAAAAA/////wIgoQcAAAAAACJRIHReA5RzC9IKCnkAae6yi02pX3PqHRITdKKZ2NqcttCTeWJ7AAAAAAAiUSD4EVq7/Ha0wNk4wJURt2v+QzMrcSZTTxCC1pP0GamtzgAAAAA=",
        slashingTx:
          "AgAAAAGX5fd8ARplfl86ok1GwbPklJmAqOMLXVVVv9u5Kaf66QAAAAAA/////wL0AQAAAAAAAAlqB2JhYnlsb26MGAYAAAAAACJRIIxLZkecZGJe/DDgvFPH32gXPTpET9wIR+ajrk3hq2rdAAAAAA==",
        delegatorSlashingSig:
          "D86t6LXojIcwXdo6gh6TkWoClcMv2a2H6LYP3ckxpq6kp4xpDJeUiaUt/4GFyYTT46QbzQF9ljOy90SttWfX9g==",
        unbondingTime: 1008,
        unbondingTx:
          "AgAAAAGX5fd8ARplfl86ok1GwbPklJmAqOMLXVVVv9u5Kaf66QAAAAAA/////wGgewcAAAAAACJRIGVXWcZAqdN06Unm4s79tr7jLlS32smgmV/lCKBLP9LNAAAAAA==",
        unbondingValue: 490400,
        unbondingSlashingTx:
          "AgAAAAFRwcQsvEtyWl+lE7o/EMH2tbYiX2RGzVymHqfi6N/a6gAAAAAA/////wLqAQAAAAAAAAlqB2JhYnlsb24W8wUAAAAAACJRIIxLZkecZGJe/DDgvFPH32gXPTpET9wIR+ajrk3hq2rdAAAAAA==",
        delegatorUnbondingSlashingSig:
          "QtYtfcJ0AGRjQp35fW5jPcmOp38JrDzknUh/4GrFvq4ombRRiRWAz6WmjyJ6pj0VmV3OcQ1EkYpH/RIgUlOTpA==",
      },
    },
  ],
  // Native SegWit
  [
    {
      publicKeyNoCoordHex: getPublicKeyNoCoord(
        "03d6781c8e9ac6fd353e97997d90befa0882c3e027a72ab12afaba5c391e5a87",
      ),
      address: "tb1qlphktyz6sse3meq36pjwjrsqktny4553paydg2",
    },
    {
      slashingPsbt:
        "70736274ff0100700200000001327d023e95b159b61998643f0c0f91ab2d4398e32b9030bcd7c6d80203f50d8f0000000000ffffffff02f401000000000000096a07626162796c6f6e8c18060000000000225120e366beca1d78015254028482014fd2589a13e158ad8796d89fa03fa1fee31ff7000000000001012b20a1070000000000225120577d5b5fb289e5492010985b93fda8d3250f97b3e2f226087d46d9f1aff5df334215c150929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac043ed89d71b74d182f5dd7c29c9a85ff886dd243d000c4f02d019471fdf28be98fd79012003d6781c8e9ac6fd353e97997d90befa0882c3e027a72ab12afaba5c391e5a87ad20d23c2c25e1fcf8fd1c21b9a402c19e2e309e531e45e92fb1e9805b6056b0cc76ad2023b29f89b45f4af41588dcaf0ca572ada32872a88224f311373917f1b37d08d1ac204b15848e495a3a62283daaadb3f458a00859fe48e321f0121ebabbdd6698f9faba208242640732773249312c47ca7bdb50ca79f15f2ecc32b9c83ceebba44fb74df7ba20cbdd028cfe32c1c1f2d84bfec71e19f92df509bba7b8ad31ca6c1a134fe09204ba20d3c79b99ac4d265c2f97ac11e3232c07a598b020cf56c6f055472c893c0967aeba20d45c70d28f169e1f0c7f4a78e2bc73497afe585b70aa897955989068f3350aaaba20de13fc96ea6899acbdc5db3afaa683f62fe35b60ff6eb723dad28a11d2b12f8cba20e36200aaa8dce9453567bba108bdc51f7f1174b97a65e4dc4402fc5de779d41cba20f178fcce82f95c524b53b077e6180bd2d779a9057fdff4255a0af95af918cee0ba569cc001172050929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0000000",
      unbondingSlashingPsbt:
        "70736274ff01007002000000016864d6be973dd95a1efdf1832d93a1f15a481b08fa42a4efdcb8119155798fad0000000000ffffffff02ea01000000000000096a07626162796c6f6e16f3050000000000225120e366beca1d78015254028482014fd2589a13e158ad8796d89fa03fa1fee31ff7000000000001012ba07b0700000000002251209bfbdfbce192c6ad5ce1a9a5ec8f7b6d57d47a860de78cf9a5bcd0d061d8353f4215c050929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac08617477ba76d85cabf3d9e16ad2d85fe82d4ee485969a625cfe042932e91e0b6fd79012003d6781c8e9ac6fd353e97997d90befa0882c3e027a72ab12afaba5c391e5a87ad20d23c2c25e1fcf8fd1c21b9a402c19e2e309e531e45e92fb1e9805b6056b0cc76ad2023b29f89b45f4af41588dcaf0ca572ada32872a88224f311373917f1b37d08d1ac204b15848e495a3a62283daaadb3f458a00859fe48e321f0121ebabbdd6698f9faba208242640732773249312c47ca7bdb50ca79f15f2ecc32b9c83ceebba44fb74df7ba20cbdd028cfe32c1c1f2d84bfec71e19f92df509bba7b8ad31ca6c1a134fe09204ba20d3c79b99ac4d265c2f97ac11e3232c07a598b020cf56c6f055472c893c0967aeba20d45c70d28f169e1f0c7f4a78e2bc73497afe585b70aa897955989068f3350aaaba20de13fc96ea6899acbdc5db3afaa683f62fe35b60ff6eb723dad28a11d2b12f8cba20e36200aaa8dce9453567bba108bdc51f7f1174b97a65e4dc4402fc5de779d41cba20f178fcce82f95c524b53b077e6180bd2d779a9057fdff4255a0af95af918cee0ba569cc001172050929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0000000",
      stakingTxHex:
        "0200000001d66d8d533edc3bcc5c5a5b0ec4b1ec7180761226cfe6a38e7af48fe2028c6a220100000000ffffffff0220a1070000000000225120577d5b5fb289e5492010985b93fda8d3250f97b3e2f226087d46d9f1aff5df3379627b0000000000160014f86f65905a84331de411d064e90e00b2e64ad29100000000",
      signedBabylonAddress:
        "AkgwRQIhAMxETaJ91QWSJOqFTECfvQMJID4gcIZ2DCUoRq0RrzeKAiAavtkp74/7B5u5N9T9g5l4/ZqRxXdsmdK4WeZga3rfhQEhAwPWeByOmsb9NT6XmX2QvvoIgsPgJ6cqsSr6ulw5HlqH",
      signType: "bip322-simple",
      signedSlashingPsbt:
        "70736274ff0100700200000001327d023e95b159b61998643f0c0f91ab2d4398e32b9030bcd7c6d80203f50d8f0000000000ffffffff02f401000000000000096a07626162796c6f6e8c18060000000000225120e366beca1d78015254028482014fd2589a13e158ad8796d89fa03fa1fee31ff7000000000001012b20a1070000000000225120577d5b5fb289e5492010985b93fda8d3250f97b3e2f226087d46d9f1aff5df330108fdff010340f215a923800d21909fc14387d6f27495ae0c4beeba5804aafee5737ff5d33670777f3f93e653fd0cf11ba5987d46f704448320969df853481415af4e38c78c28fd78012003d6781c8e9ac6fd353e97997d90befa0882c3e027a72ab12afaba5c391e5a87ad20d23c2c25e1fcf8fd1c21b9a402c19e2e309e531e45e92fb1e9805b6056b0cc76ad2023b29f89b45f4af41588dcaf0ca572ada32872a88224f311373917f1b37d08d1ac204b15848e495a3a62283daaadb3f458a00859fe48e321f0121ebabbdd6698f9faba208242640732773249312c47ca7bdb50ca79f15f2ecc32b9c83ceebba44fb74df7ba20cbdd028cfe32c1c1f2d84bfec71e19f92df509bba7b8ad31ca6c1a134fe09204ba20d3c79b99ac4d265c2f97ac11e3232c07a598b020cf56c6f055472c893c0967aeba20d45c70d28f169e1f0c7f4a78e2bc73497afe585b70aa897955989068f3350aaaba20de13fc96ea6899acbdc5db3afaa683f62fe35b60ff6eb723dad28a11d2b12f8cba20e36200aaa8dce9453567bba108bdc51f7f1174b97a65e4dc4402fc5de779d41cba20f178fcce82f95c524b53b077e6180bd2d779a9057fdff4255a0af95af918cee0ba569c41c150929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac043ed89d71b74d182f5dd7c29c9a85ff886dd243d000c4f02d019471fdf28be98000000",
      signedUnbondingSlashingPsbt:
        "70736274ff01007002000000016864d6be973dd95a1efdf1832d93a1f15a481b08fa42a4efdcb8119155798fad0000000000ffffffff02ea01000000000000096a07626162796c6f6e16f3050000000000225120e366beca1d78015254028482014fd2589a13e158ad8796d89fa03fa1fee31ff7000000000001012ba07b0700000000002251209bfbdfbce192c6ad5ce1a9a5ec8f7b6d57d47a860de78cf9a5bcd0d061d8353f0108fdff01034058f5855f757e8e7b6913522d1118cad511cf17f6769875ba2260b989123cd7f450a537399859e3c817ac05c3938da076d28f3c385d4fcdd3856de30f4c288ea4fd78012003d6781c8e9ac6fd353e97997d90befa0882c3e027a72ab12afaba5c391e5a87ad20d23c2c25e1fcf8fd1c21b9a402c19e2e309e531e45e92fb1e9805b6056b0cc76ad2023b29f89b45f4af41588dcaf0ca572ada32872a88224f311373917f1b37d08d1ac204b15848e495a3a62283daaadb3f458a00859fe48e321f0121ebabbdd6698f9faba208242640732773249312c47ca7bdb50ca79f15f2ecc32b9c83ceebba44fb74df7ba20cbdd028cfe32c1c1f2d84bfec71e19f92df509bba7b8ad31ca6c1a134fe09204ba20d3c79b99ac4d265c2f97ac11e3232c07a598b020cf56c6f055472c893c0967aeba20d45c70d28f169e1f0c7f4a78e2bc73497afe585b70aa897955989068f3350aaaba20de13fc96ea6899acbdc5db3afaa683f62fe35b60ff6eb723dad28a11d2b12f8cba20e36200aaa8dce9453567bba108bdc51f7f1174b97a65e4dc4402fc5de779d41cba20f178fcce82f95c524b53b077e6180bd2d779a9057fdff4255a0af95af918cee0ba569c41c050929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac08617477ba76d85cabf3d9e16ad2d85fe82d4ee485969a625cfe042932e91e0b6000000",
      postStakingDelegationMsg: {
        stakerAddr: "bbn1cyqgpk0nlsutlm5ymkfpya30fqntanc8slpure",
        pop: {
          btcSigType: "BIP322",
          btcSig:
            "Cip0YjFxbHBoa3R5ejZzc2UzbWVxMzZwandqcnNxa3RueTQ1NTNwYXlkZzISbAJIMEUCIQDMRE2ifdUFkiTqhUxAn70DCSA+IHCGdgwlKEatEa83igIgGr7ZKe+P+webuTfU/YOZeP2akcV3bJnSuFnmYGt634UBIQMD1ngcjprG/TU+l5l9kL76CILD4CenKrEq+rpcOR5ahw==",
        },
        btcPk: "A9Z4HI6axv01PpeZfZC++giCw+AnpyqxKvq6XDkeWoc=",
        fpBtcPkList: ["0jwsJeH8+P0cIbmkAsGeLjCeUx5F6S+x6YBbYFawzHY="],
        stakingTime: 64000,
        stakingValue: 500000,
        stakingTx:
          "AgAAAAHWbY1TPtw7zFxaWw7EsexxgHYSJs/mo4569I/iAoxqIgEAAAAA/////wIgoQcAAAAAACJRIFd9W1+yieVJIBCYW5P9qNMlD5ez4vImCH1G2fGv9d8zeWJ7AAAAAAAWABT4b2WQWoQzHeQR0GTpDgCy5krSkQAAAAA=",
        stakingTxInclusionProof: {
          key: {
            index: 182,
            hash: "kFJzEOcdOpI/twNJ9K/qsIXWbu0TDYOkTV29bIIAAAA=",
          },
          proof:
            "QmFz1hg6euFbROHG0FJwspulsAUBYJu6xLvFjewWxGy5Fyv+TjCQ61lgUQ9mi99On/Q4WB7olRoeI7dOhn4Vh3012zkV3b5WFA30MfHfO2T9gnrQiX1JSEWEsDZec3ZszEU5baFuvcl9sZD3zxgNdoAneVZU6CMdp63+v7domlrHUlVKngByzPuMsm8u8kP/TwRQgBXVvo1CIz1kF4jK+bCU6cAX7HGRNWZGE6Crkwya/eD0EqPCQPprXAthsNT3Oor7O3XpqZN6oHX18lZ5uF8I4QAhIm3uHd2nooKVbFk88z29qYnut37DZr+CT7PlmoVZblKCf7E2xtixv6QEwGNXV2LEjQTtNsG7mdK+R4KMW6m/81JXEnPhGMIiEzof",
        },
        slashingTx:
          "AgAAAAEyfQI+lbFZthmYZD8MD5GrLUOY4yuQMLzXxtgCA/UNjwAAAAAA/////wL0AQAAAAAAAAlqB2JhYnlsb26MGAYAAAAAACJRIONmvsodeAFSVAKEggFP0liaE+FYrYeW2J+gP6H+4x/3AAAAAA==",
        delegatorSlashingSig:
          "8hWpI4ANIZCfwUOH1vJ0la4MS+66WASq/uVzf/XTNnB3fz+T5lP9DPEbpZh9RvcERIMglp34U0gUFa9OOMeMKA==",
        unbondingTime: 1008,
        unbondingTx:
          "AgAAAAEyfQI+lbFZthmYZD8MD5GrLUOY4yuQMLzXxtgCA/UNjwAAAAAA/////wGgewcAAAAAACJRIJv737zhksatXOGppeyPe21X1HqGDeeM+aW80NBh2DU/AAAAAA==",
        unbondingValue: 490400,
        unbondingSlashingTx:
          "AgAAAAFoZNa+lz3ZWh798YMtk6HxWkgbCPpCpO/cuBGRVXmPrQAAAAAA/////wLqAQAAAAAAAAlqB2JhYnlsb24W8wUAAAAAACJRIONmvsodeAFSVAKEggFP0liaE+FYrYeW2J+gP6H+4x/3AAAAAA==",
        delegatorUnbondingSlashingSig:
          "WPWFX3V+jntpE1ItERjK1RHPF/Z2mHW6ImC5iRI81/RQpTc5mFnjyBesBcOTjaB20o88OF1PzdOFbeMPTCiOpA==",
      },
      delegationMsg: {
        stakerAddr: "bbn1cyqgpk0nlsutlm5ymkfpya30fqntanc8slpure",
        pop: {
          btcSigType: "BIP322",
          btcSig:
            "Cip0YjFxbHBoa3R5ejZzc2UzbWVxMzZwandqcnNxa3RueTQ1NTNwYXlkZzISbAJIMEUCIQDMRE2ifdUFkiTqhUxAn70DCSA+IHCGdgwlKEatEa83igIgGr7ZKe+P+webuTfU/YOZeP2akcV3bJnSuFnmYGt634UBIQMD1ngcjprG/TU+l5l9kL76CILD4CenKrEq+rpcOR5ahw==",
        },
        btcPk: "A9Z4HI6axv01PpeZfZC++giCw+AnpyqxKvq6XDkeWoc=",
        fpBtcPkList: ["0jwsJeH8+P0cIbmkAsGeLjCeUx5F6S+x6YBbYFawzHY="],
        stakingTime: 64000,
        stakingValue: 500000,
        stakingTx:
          "AgAAAAHWbY1TPtw7zFxaWw7EsexxgHYSJs/mo4569I/iAoxqIgEAAAAA/////wIgoQcAAAAAACJRIFd9W1+yieVJIBCYW5P9qNMlD5ez4vImCH1G2fGv9d8zeWJ7AAAAAAAWABT4b2WQWoQzHeQR0GTpDgCy5krSkQAAAAA=",
        slashingTx:
          "AgAAAAEyfQI+lbFZthmYZD8MD5GrLUOY4yuQMLzXxtgCA/UNjwAAAAAA/////wL0AQAAAAAAAAlqB2JhYnlsb26MGAYAAAAAACJRIONmvsodeAFSVAKEggFP0liaE+FYrYeW2J+gP6H+4x/3AAAAAA==",
        delegatorSlashingSig:
          "8hWpI4ANIZCfwUOH1vJ0la4MS+66WASq/uVzf/XTNnB3fz+T5lP9DPEbpZh9RvcERIMglp34U0gUFa9OOMeMKA==",
        unbondingTime: 1008,
        unbondingTx:
          "AgAAAAEyfQI+lbFZthmYZD8MD5GrLUOY4yuQMLzXxtgCA/UNjwAAAAAA/////wGgewcAAAAAACJRIJv737zhksatXOGppeyPe21X1HqGDeeM+aW80NBh2DU/AAAAAA==",
        unbondingValue: 490400,
        unbondingSlashingTx:
          "AgAAAAFoZNa+lz3ZWh798YMtk6HxWkgbCPpCpO/cuBGRVXmPrQAAAAAA/////wLqAQAAAAAAAAlqB2JhYnlsb24W8wUAAAAAACJRIONmvsodeAFSVAKEggFP0liaE+FYrYeW2J+gP6H+4x/3AAAAAA==",
        delegatorUnbondingSlashingSig:
          "WPWFX3V+jntpE1ItERjK1RHPF/Z2mHW6ImC5iRI81/RQpTc5mFnjyBesBcOTjaB20o88OF1PzdOFbeMPTCiOpA==",
      },
    },
  ],
  // Legacy
  [
    {
      publicKeyNoCoordHex: getPublicKeyNoCoord(
        "028333358d13582af186073cb3ad86c34630c186d7490603c4ce60fb51221c9a37",
      ),
      address: "msSV7NptGswtM4k7Qom6f9efJ2rcZQQ8Ho",
    },
    {
      slashingPsbt:
        "70736274ff010070020000000136fed8cea71d15ae6e4feda28f5658dd703d5bd20dfa9616dfb61b87b46578a20000000000ffffffff02f401000000000000096a07626162796c6f6e8c180600000000002251208bde60793a23f470a28e7f9b945a3d87e33f5e1d3253ed74f198762b14e92722000000000001012b20a10700000000002251201ed570c15555ca26344c8d1d5ee8ed8764a2869980839030c68f5dd71727d7414215c050929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac074721ff8a756f465256499df328a3f3caba2cd9255953706a8ac424261d96536fd7901208333358d13582af186073cb3ad86c34630c186d7490603c4ce60fb51221c9a37ad20d23c2c25e1fcf8fd1c21b9a402c19e2e309e531e45e92fb1e9805b6056b0cc76ad2023b29f89b45f4af41588dcaf0ca572ada32872a88224f311373917f1b37d08d1ac204b15848e495a3a62283daaadb3f458a00859fe48e321f0121ebabbdd6698f9faba208242640732773249312c47ca7bdb50ca79f15f2ecc32b9c83ceebba44fb74df7ba20cbdd028cfe32c1c1f2d84bfec71e19f92df509bba7b8ad31ca6c1a134fe09204ba20d3c79b99ac4d265c2f97ac11e3232c07a598b020cf56c6f055472c893c0967aeba20d45c70d28f169e1f0c7f4a78e2bc73497afe585b70aa897955989068f3350aaaba20de13fc96ea6899acbdc5db3afaa683f62fe35b60ff6eb723dad28a11d2b12f8cba20e36200aaa8dce9453567bba108bdc51f7f1174b97a65e4dc4402fc5de779d41cba20f178fcce82f95c524b53b077e6180bd2d779a9057fdff4255a0af95af918cee0ba569cc001172050929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0000000",
      unbondingSlashingPsbt:
        "70736274ff0100700200000001d987aa78255e723474e10cfc7ac640432ef138bea619d579d1e28475446acf2c0000000000ffffffff02ea01000000000000096a07626162796c6f6e16f30500000000002251208bde60793a23f470a28e7f9b945a3d87e33f5e1d3253ed74f198762b14e92722000000000001012ba07b070000000000225120eb99851e9f7dfdaa1e818a5c4146ee8c6d7683600fa0451e0da3794e1debff564215c150929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac055355230be6141ba692e3ebbc0f553fb05a8160245890ecbceae6704830a9a90fd7901208333358d13582af186073cb3ad86c34630c186d7490603c4ce60fb51221c9a37ad20d23c2c25e1fcf8fd1c21b9a402c19e2e309e531e45e92fb1e9805b6056b0cc76ad2023b29f89b45f4af41588dcaf0ca572ada32872a88224f311373917f1b37d08d1ac204b15848e495a3a62283daaadb3f458a00859fe48e321f0121ebabbdd6698f9faba208242640732773249312c47ca7bdb50ca79f15f2ecc32b9c83ceebba44fb74df7ba20cbdd028cfe32c1c1f2d84bfec71e19f92df509bba7b8ad31ca6c1a134fe09204ba20d3c79b99ac4d265c2f97ac11e3232c07a598b020cf56c6f055472c893c0967aeba20d45c70d28f169e1f0c7f4a78e2bc73497afe585b70aa897955989068f3350aaaba20de13fc96ea6899acbdc5db3afaa683f62fe35b60ff6eb723dad28a11d2b12f8cba20e36200aaa8dce9453567bba108bdc51f7f1174b97a65e4dc4402fc5de779d41cba20f178fcce82f95c524b53b077e6180bd2d779a9057fdff4255a0af95af918cee0ba569cc001172050929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0000000",
      stakingTxHex:
        "0200000001d66d8d533edc3bcc5c5a5b0ec4b1ec7180761226cfe6a38e7af48fe2028c6a220100000000ffffffff0220a10700000000002251201ed570c15555ca26344c8d1d5ee8ed8764a2869980839030c68f5dd71727d74179627b00000000001976a91482c9274701435286dc0bce950d9648878d466ad688ac00000000",
      signedBabylonAddress:
        "H+DSu5O5tgPBv1HUj+E8+KQSP3Guqdydr0LOTTcwJTldesgjEQyzvurLcVeliK3uXt7rjahIjK97JXBaoWVcgZc=",
      signType: "ecdsa",
      signedSlashingPsbt:
        "70736274ff010070020000000136fed8cea71d15ae6e4feda28f5658dd703d5bd20dfa9616dfb61b87b46578a20000000000ffffffff02f401000000000000096a07626162796c6f6e8c180600000000002251208bde60793a23f470a28e7f9b945a3d87e33f5e1d3253ed74f198762b14e92722000000000001012b20a10700000000002251201ed570c15555ca26344c8d1d5ee8ed8764a2869980839030c68f5dd71727d7410108fdff01034086ecbd50fecf3c86748f9504c858ebc3211f8e22cd70e2b96ca0910e0d9664610e84fbaa8447c8431cde3a05e890145c40f039133a98d50b94cabef65dec8e1dfd7801208333358d13582af186073cb3ad86c34630c186d7490603c4ce60fb51221c9a37ad20d23c2c25e1fcf8fd1c21b9a402c19e2e309e531e45e92fb1e9805b6056b0cc76ad2023b29f89b45f4af41588dcaf0ca572ada32872a88224f311373917f1b37d08d1ac204b15848e495a3a62283daaadb3f458a00859fe48e321f0121ebabbdd6698f9faba208242640732773249312c47ca7bdb50ca79f15f2ecc32b9c83ceebba44fb74df7ba20cbdd028cfe32c1c1f2d84bfec71e19f92df509bba7b8ad31ca6c1a134fe09204ba20d3c79b99ac4d265c2f97ac11e3232c07a598b020cf56c6f055472c893c0967aeba20d45c70d28f169e1f0c7f4a78e2bc73497afe585b70aa897955989068f3350aaaba20de13fc96ea6899acbdc5db3afaa683f62fe35b60ff6eb723dad28a11d2b12f8cba20e36200aaa8dce9453567bba108bdc51f7f1174b97a65e4dc4402fc5de779d41cba20f178fcce82f95c524b53b077e6180bd2d779a9057fdff4255a0af95af918cee0ba569c41c050929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac074721ff8a756f465256499df328a3f3caba2cd9255953706a8ac424261d96536000000",
      signedUnbondingSlashingPsbt:
        "70736274ff0100700200000001d987aa78255e723474e10cfc7ac640432ef138bea619d579d1e28475446acf2c0000000000ffffffff02ea01000000000000096a07626162796c6f6e16f30500000000002251208bde60793a23f470a28e7f9b945a3d87e33f5e1d3253ed74f198762b14e92722000000000001012ba07b070000000000225120eb99851e9f7dfdaa1e818a5c4146ee8c6d7683600fa0451e0da3794e1debff560108fdff0103401b884aea88c45e4b557f1159cb7abb6e8d4f2b0af2221d9793e2bb8de801385141f82777662138cd87718a9246fca52e7d7484ec413b0376eaaad1cc28ba9077fd7801208333358d13582af186073cb3ad86c34630c186d7490603c4ce60fb51221c9a37ad20d23c2c25e1fcf8fd1c21b9a402c19e2e309e531e45e92fb1e9805b6056b0cc76ad2023b29f89b45f4af41588dcaf0ca572ada32872a88224f311373917f1b37d08d1ac204b15848e495a3a62283daaadb3f458a00859fe48e321f0121ebabbdd6698f9faba208242640732773249312c47ca7bdb50ca79f15f2ecc32b9c83ceebba44fb74df7ba20cbdd028cfe32c1c1f2d84bfec71e19f92df509bba7b8ad31ca6c1a134fe09204ba20d3c79b99ac4d265c2f97ac11e3232c07a598b020cf56c6f055472c893c0967aeba20d45c70d28f169e1f0c7f4a78e2bc73497afe585b70aa897955989068f3350aaaba20de13fc96ea6899acbdc5db3afaa683f62fe35b60ff6eb723dad28a11d2b12f8cba20e36200aaa8dce9453567bba108bdc51f7f1174b97a65e4dc4402fc5de779d41cba20f178fcce82f95c524b53b077e6180bd2d779a9057fdff4255a0af95af918cee0ba569c41c150929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac055355230be6141ba692e3ebbc0f553fb05a8160245890ecbceae6704830a9a90000000",
      postStakingDelegationMsg: {
        stakerAddr: "bbn1cyqgpk0nlsutlm5ymkfpya30fqntanc8slpure",
        pop: {
          btcSigType: "ECDSA",
          btcSig:
            "H+DSu5O5tgPBv1HUj+E8+KQSP3Guqdydr0LOTTcwJTldesgjEQyzvurLcVeliK3uXt7rjahIjK97JXBaoWVcgZc=",
        },
        btcPk: "gzM1jRNYKvGGBzyzrYbDRjDBhtdJBgPEzmD7USIcmjc=",
        fpBtcPkList: ["0jwsJeH8+P0cIbmkAsGeLjCeUx5F6S+x6YBbYFawzHY="],
        stakingTime: 64000,
        stakingValue: 500000,
        stakingTx:
          "AgAAAAHWbY1TPtw7zFxaWw7EsexxgHYSJs/mo4569I/iAoxqIgEAAAAA/////wIgoQcAAAAAACJRIB7VcMFVVcomNEyNHV7o7YdkooaZgIOQMMaPXdcXJ9dBeWJ7AAAAAAAZdqkUgsknRwFDUobcC86VDZZIh41GataIrAAAAAA=",
        stakingTxInclusionProof: {
          key: {
            index: 182,
            hash: "kFJzEOcdOpI/twNJ9K/qsIXWbu0TDYOkTV29bIIAAAA=",
          },
          proof:
            "QmFz1hg6euFbROHG0FJwspulsAUBYJu6xLvFjewWxGy5Fyv+TjCQ61lgUQ9mi99On/Q4WB7olRoeI7dOhn4Vh3012zkV3b5WFA30MfHfO2T9gnrQiX1JSEWEsDZec3ZszEU5baFuvcl9sZD3zxgNdoAneVZU6CMdp63+v7domlrHUlVKngByzPuMsm8u8kP/TwRQgBXVvo1CIz1kF4jK+bCU6cAX7HGRNWZGE6Crkwya/eD0EqPCQPprXAthsNT3Oor7O3XpqZN6oHX18lZ5uF8I4QAhIm3uHd2nooKVbFk88z29qYnut37DZr+CT7PlmoVZblKCf7E2xtixv6QEwGNXV2LEjQTtNsG7mdK+R4KMW6m/81JXEnPhGMIiEzof",
        },
        slashingTx:
          "AgAAAAE2/tjOpx0Vrm5P7aKPVljdcD1b0g36lhbfthuHtGV4ogAAAAAA/////wL0AQAAAAAAAAlqB2JhYnlsb26MGAYAAAAAACJRIIveYHk6I/Rwoo5/m5RaPYfjP14dMlPtdPGYdisU6SciAAAAAA==",
        delegatorSlashingSig:
          "huy9UP7PPIZ0j5UEyFjrwyEfjiLNcOK5bKCRDg2WZGEOhPuqhEfIQxzeOgXokBRcQPA5EzqY1QuUyr72XeyOHQ==",
        unbondingTime: 1008,
        unbondingTx:
          "AgAAAAE2/tjOpx0Vrm5P7aKPVljdcD1b0g36lhbfthuHtGV4ogAAAAAA/////wGgewcAAAAAACJRIOuZhR6fff2qHoGKXEFG7oxtdoNgD6BFHg2jeU4d6/9WAAAAAA==",
        unbondingValue: 490400,
        unbondingSlashingTx:
          "AgAAAAHZh6p4JV5yNHThDPx6xkBDLvE4vqYZ1XnR4oR1RGrPLAAAAAAA/////wLqAQAAAAAAAAlqB2JhYnlsb24W8wUAAAAAACJRIIveYHk6I/Rwoo5/m5RaPYfjP14dMlPtdPGYdisU6SciAAAAAA==",
        delegatorUnbondingSlashingSig:
          "G4hK6ojEXktVfxFZy3q7bo1PKwryIh2Xk+K7jegBOFFB+Cd3ZiE4zYdxipJG/KUufXSE7EE7A3bqqtHMKLqQdw==",
      },
      delegationMsg: {
        stakerAddr: "bbn1cyqgpk0nlsutlm5ymkfpya30fqntanc8slpure",
        pop: {
          btcSigType: "ECDSA",
          btcSig:
            "H+DSu5O5tgPBv1HUj+E8+KQSP3Guqdydr0LOTTcwJTldesgjEQyzvurLcVeliK3uXt7rjahIjK97JXBaoWVcgZc=",
        },
        btcPk: "gzM1jRNYKvGGBzyzrYbDRjDBhtdJBgPEzmD7USIcmjc=",
        fpBtcPkList: ["0jwsJeH8+P0cIbmkAsGeLjCeUx5F6S+x6YBbYFawzHY="],
        stakingTime: 64000,
        stakingValue: 500000,
        stakingTx:
          "AgAAAAHWbY1TPtw7zFxaWw7EsexxgHYSJs/mo4569I/iAoxqIgEAAAAA/////wIgoQcAAAAAACJRIB7VcMFVVcomNEyNHV7o7YdkooaZgIOQMMaPXdcXJ9dBeWJ7AAAAAAAZdqkUgsknRwFDUobcC86VDZZIh41GataIrAAAAAA=",
        slashingTx:
          "AgAAAAE2/tjOpx0Vrm5P7aKPVljdcD1b0g36lhbfthuHtGV4ogAAAAAA/////wL0AQAAAAAAAAlqB2JhYnlsb26MGAYAAAAAACJRIIveYHk6I/Rwoo5/m5RaPYfjP14dMlPtdPGYdisU6SciAAAAAA==",
        delegatorSlashingSig:
          "huy9UP7PPIZ0j5UEyFjrwyEfjiLNcOK5bKCRDg2WZGEOhPuqhEfIQxzeOgXokBRcQPA5EzqY1QuUyr72XeyOHQ==",
        unbondingTime: 1008,
        unbondingTx:
          "AgAAAAE2/tjOpx0Vrm5P7aKPVljdcD1b0g36lhbfthuHtGV4ogAAAAAA/////wGgewcAAAAAACJRIOuZhR6fff2qHoGKXEFG7oxtdoNgD6BFHg2jeU4d6/9WAAAAAA==",
        unbondingValue: 490400,
        unbondingSlashingTx:
          "AgAAAAHZh6p4JV5yNHThDPx6xkBDLvE4vqYZ1XnR4oR1RGrPLAAAAAAA/////wLqAQAAAAAAAAlqB2JhYnlsb24W8wUAAAAAACJRIIveYHk6I/Rwoo5/m5RaPYfjP14dMlPtdPGYdisU6SciAAAAAA==",
        delegatorUnbondingSlashingSig:
          "G4hK6ojEXktVfxFZy3q7bo1PKwryIh2Xk+K7jegBOFFB+Cd3ZiE4zYdxipJG/KUufXSE7EE7A3bqqtHMKLqQdw==",
      },
    },
  ],
] as const;

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
  [800_000, "Babylon params not found for height 800000"],
] as [number, string][];

export const feeRate = 4;

export const invalidBabylonAddresses = [
  "invalid-babylon-address",
  "cosmos1cyqgpk0nlsutlm5ymkfpya30fqntanc8slpure",
  "bbn1cyqgpk0nlsutlm5ymkfpya30fqntanc8spure",
  "tb1plqg44wluw66vpkfccz23rdmtlepnx2m3yef57yyz66flgxdf4h8q7wu6pf",
  "cyqgpk0nlsutlm5ymkfpya30fqntanc8s",
];

export const stakingTx = Transaction.fromHex(
  "0200000001d66d8d533edc3bcc5c5a5b0ec4b1ec7180761226cfe6a38e7af48fe2028c6a220100000000ffffffff0220a1070000000000225120577d5b5fb289e5492010985b93fda8d3250f97b3e2f226087d46d9f1aff5df3379627b0000000000160014f86f65905a84331de411d064e90e00b2e64ad29100000000",
);

export const inclusionProof = {
  blockHashHex:
    "000000826cbd5d4da4830d13ed6ed685b0eaaff44903b73f923a1de710735290",
  merkle: [
    "6cc416ec8dc5bbc4ba9b600105b0a59bb27052d0c6e1445be17a3a18d6736142",
    "87157e864eb7231e1a95e81e5838f49f4edf8b660f516059eb90304efe2b17b9",
    "6c76735e36b0844548497d89d07a82fd643bdff131f40d1456bedd1539db357d",
    "5a9a68b7bffeada71d23e85456792780760d18cff790b17dc9bd6ea16d3945cc",
    "f9ca8817643d23428dbed5158050044fff43f22e6fb28cfbcc72009e4a5552c7",
    "f7d4b0610b5c6bfa40c2a312f4e0fd9a0c93aba0134666359171ec17c0e994b0",
    "596c9582a2a7dd1dee6d222100e1085fb87956f2f575a07a93a9e9753bfb8a3a",
    "c004a4bfb1d8c636b17f82526e59859ae5b34f82bf66c37eb7ee89a9bd3df33c",
    "1f3a1322c218e173125752f3bfa95b8c8247bed299bbc136ed048dc462575763",
  ],
  pos: 182,
};
