// Per-network on-chain bootstrap references for protocol detection.

import { Core } from "@blaze-cardano/sdk";
// Source of truth: frontend/app/config/{mainnet,preprod,preview}.json
// (proxyBootstrap/treasuryBootstrap/stakingVaultBootstrap, stablecoinAssetName,
// sUSDrAssetName). Update an entry only when that network's protocol is
// redeployed with new bootstrap UTxOs.
//
// Frozen (entry + bootstrap objects): NETWORK_REGISTRY is shared by reference
// into detectSDKParams — a consumer mutating proxyBootstrap.txHash would
// otherwise poison every later detectParams(provider, "mainnet") call.
const freezeBootstrap = b => Object.freeze(b);
const freezeDetectInput = entry => Object.freeze({
  ...entry,
  proxyBootstrap: freezeBootstrap(entry.proxyBootstrap),
  treasuryBootstrap: freezeBootstrap(entry.treasuryBootstrap),
  stakingVaultBootstrap: freezeBootstrap(entry.stakingVaultBootstrap),
  ...(entry.yieldOracleBootstrap ? {
    yieldOracleBootstrap: freezeBootstrap(entry.yieldOracleBootstrap)
  } : {})
});
export const NETWORK_REGISTRY = Object.freeze({
  mainnet: freezeDetectInput({
    proxyBootstrap: {
      txHash: Core.TransactionId("d09c01e21d4ee92b9e58686ca0284288c9c889d8e1a9ab7ab799211a171863ac"),
      outputIndex: 0n
    },
    treasuryBootstrap: {
      txHash: Core.TransactionId("d09c01e21d4ee92b9e58686ca0284288c9c889d8e1a9ab7ab799211a171863ac"),
      outputIndex: 1n
    },
    stakingVaultBootstrap: {
      txHash: Core.TransactionId("d09c01e21d4ee92b9e58686ca0284288c9c889d8e1a9ab7ab799211a171863ac"),
      outputIndex: 2n
    },
    assetNameHex: "55534472",
    sUSDrAssetNameHex: "7355534472"
  }),
  preprod: freezeDetectInput({
    proxyBootstrap: {
      txHash: Core.TransactionId("d9654f43caff2b471bc4db912d8ec6d1932cb48093c3fa2fc3f564519ac855f7"),
      outputIndex: 0n
    },
    treasuryBootstrap: {
      txHash: Core.TransactionId("d9654f43caff2b471bc4db912d8ec6d1932cb48093c3fa2fc3f564519ac855f7"),
      outputIndex: 1n
    },
    stakingVaultBootstrap: {
      txHash: Core.TransactionId("d9654f43caff2b471bc4db912d8ec6d1932cb48093c3fa2fc3f564519ac855f7"),
      outputIndex: 2n
    },
    assetNameHex: "55534472",
    sUSDrAssetNameHex: "7355534472"
  }),
  preview: freezeDetectInput({
    proxyBootstrap: {
      txHash: Core.TransactionId("a32795a0be2dfef61583ab0d7b2c959bbbeab159530dc5a3ef0fa61d94595c99"),
      outputIndex: 1n
    },
    treasuryBootstrap: {
      txHash: Core.TransactionId("cf7450305eeaca76ee15a2a863b7d2d272dce7493feae489ec18395cc22b4646"),
      outputIndex: 2n
    },
    stakingVaultBootstrap: {
      txHash: Core.TransactionId("17ad2403529298bc8b6a3150069cb0edf55a17e3c334d8b9e0f98ca0e3922bbb"),
      outputIndex: 0n
    },
    assetNameHex: "55534472",
    sUSDrAssetNameHex: "7355534472"
  })
});
//# sourceMappingURL=network-registry.js.map