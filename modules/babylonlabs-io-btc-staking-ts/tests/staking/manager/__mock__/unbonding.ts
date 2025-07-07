import { Transaction } from "bitcoinjs-lib";
import { getPublicKeyNoCoord } from "../../../../src";

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

export const stakingTx = Transaction.fromHex(
  "0200000001d66d8d533edc3bcc5c5a5b0ec4b1ec7180761226cfe6a38e7af48fe2028c6a220100000000ffffffff02f82a000000000000225120c3177fd7052d79a2d50a5c60217f0b5855371fe5f9a5322bafa8fcd24a3c31a354da820000000000225120f8115abbfc76b4c0d938c09511b76bfe43332b7126534f1082d693f419a9adce00000000",
);

export const stakingInput = {
  stakingAmountSat: 11_000,
  finalityProviderPksNoCoordHex: [
    getPublicKeyNoCoord(
      "02eb83395c33cf784f7dfb90dcc918b5620ddd67fe6617806f079322dc4db2f0",
    ),
  ],
  stakingTimelock: 100,
};

export const version = 2;

export const covenantUnbondingSignatures = [
  {
    btcPkHex:
      "a5c60c2188e833d39d0fa798ab3f69aa12ed3dd2f3bad659effa252782de3c31",
    sigHex:
      "6bcfc07a4b0caa6f047821e6553bad8a4e3a8f134d41619566a8f2b926ea1fa838d4a098eb2ea8516bc1e6f4ea53d23b6af3acc14b9dfb5fbcb57a9756e32606",
  },
  {
    btcPkHex:
      "ffeaec52a9b407b355ef6967a7ffc15fd6c3fe07de2844d61550475e7a5233e5",
    sigHex:
      "45f23ff78495e8d35b06b504017ff0f57c6d1a48878359675fd51e2e52570910a0e61439761cddcb4a5956a333a943c4937ff13514dd582cdf48435066311f17",
  },
  {
    btcPkHex:
      "59d3532148a597a2d05c0395bf5f7176044b1cd312f37701a9b4d0aad70bc5a4",
    sigHex:
      "4cc1246632df302ce78cb374de5d153df107a227d726ec81ec3de49b72cc47d3a0cca3a3ee38d74823390b758f0a451e8b5bb98068e7814ce2664532cba80436",
  },
];

export const unbondingPsbt =
  "70736274ff01005e02000000011e70a47d4ad5d4b67f428797805d888a0bf8bc74bbf6a34f6651b4765524d4c60000000000ffffffff01042900000000000022512084a0af8755a320a6cd0d7d12192322c716a71ce50831316733a276baf649b944000000000001012bf82a000000000000225120c3177fd7052d79a2d50a5c60217f0b5855371fe5f9a5322bafa8fcd24a3c31a36215c150929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0822a15c402bc3de196e9dfe6d4bcf9b55978f4da73fb0b18ebc083136ee58a3baf6b354e2c079c6d444ef391f391ece3b06e354895586ccb9847aa6a0ab141568b200874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0cad2059d3532148a597a2d05c0395bf5f7176044b1cd312f37701a9b4d0aad70bc5a4ac20a5c60c2188e833d39d0fa798ab3f69aa12ed3dd2f3bad659effa252782de3c31ba20ffeaec52a9b407b355ef6967a7ffc15fd6c3fe07de2844d61550475e7a5233e5ba529cc001172050929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac00000";

export const stakerInfo = {
  publicKeyNoCoordHex: getPublicKeyNoCoord(
    "0874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0c",
  ),
  address: "tb1plqg44wluw66vpkfccz23rdmtlepnx2m3yef57yyz66flgxdf4h8q7wu6pf",
};
