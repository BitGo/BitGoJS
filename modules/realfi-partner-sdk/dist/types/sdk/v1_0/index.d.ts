import type { Provider } from "@blaze-cardano/query";
import { type Blaze, Core, type Wallet } from "@blaze-cardano/sdk";
import type { RegistryV1, SettingsV1, VaultDatumV1 } from "../../generated-types/v1_0/index.js";
import type { TV1SettingsConfig } from "../v1/types.js";
import { RealfiSDKV1Family } from "../v1/family.js";
export { DIRECT_ACTION_PADDING_ASSET, type ITreasuryUnstakeOrderTxResult, } from "../v1/family.js";
export interface IRealfiSDKParamsV1_0 {
    version: "V1_0";
    proxyBootstrap: {
        txHash: Core.TransactionId;
        outputIndex: bigint;
    };
    /** USDr asset name hex */
    assetNameHex: string;
    /** sUSDr asset name hex */
    sUSDrAssetNameHex: string;
    /** The treasury bootstrap UTxO reference */
    treasuryBootstrap: {
        txHash: Core.TransactionId;
        outputIndex: bigint;
    };
    /** The staking vault bootstrap UTxO reference */
    stakingVaultBootstrap: {
        txHash: Core.TransactionId;
        outputIndex: bigint;
    };
    /** Enable trace output in Plutus scripts for debugging. Default: false */
    enableTrace?: boolean;
    /**
     * Fallback slippage tolerance (in basis points) used by buildStakeOrderTx /
     * buildUnstakeOrderTx when the caller doesn't pass a per-call value and
     * doesn't pass an explicit `minReceived`. 50n = 0.5%. Default: 50n.
     */
    defaultSlippageToleranceBps?: bigint;
    /**
     * Use V0.1 treasury script instead of V1.0.
     * This is needed for protocol-only upgrades where the treasury NFT
     * remains at the V0.1 treasury address. Default: false
     */
    useV0_1Treasury?: boolean;
    /**
     * Use V0.4 staking vault script instead of V1.0.
     * This is needed for protocol-only upgrades where the vault NFT
     * remains at the V0.4 vault address. Default: false
     */
    useV0_4StakingVault?: boolean;
    /**
     * Hashes of the validators this deployment actually runs. See
     * IV1FamilyConstructorParams.deployedValidators — without them, identity is
     * derived from bundled artifacts and an order can be locked at an address
     * nothing watches.
     */
    deployedValidators?: Readonly<Record<string, string>>;
    /**
     * Address to deploy reference scripts to (and resolve them from). When
     * omitted, Blaze's burn address is used for both deploy and resolve.
     */
    scriptDeploymentAddress?: Core.Address;
    referenceInputs?: {
        protocolRefInput?: Core.TransactionUnspentOutput;
        proxyRefInput?: Core.TransactionUnspentOutput;
        treasuryRefInput?: Core.TransactionUnspentOutput;
        orderRefInput?: Core.TransactionUnspentOutput;
        stakingVaultRefInput?: Core.TransactionUnspentOutput;
    };
    clientSource?: import("../shared/client-id.js").TClientSource;
}
/**
 * V1_0 SDK implementation.
 *
 * Extends V0_4 with:
 * - DirectMint/DirectBurn: Mint/burn USDr without reserve asset flow (for fiat wire scenarios)
 * - Invalidated redeemer: Allow order owners to recover funds when protocol is upgraded
 * - Forfeit parameter: Support yield forfeiture during unstake operations
 * - New Settings fields: direct_mint_permission, direct_burn_permission
 *
 * All transaction-building logic lives in {@link RealfiSDKV1Family}; this
 * class instantiates the V1_0 scripts and implements the version seams
 * (flat settings, 1-field vault datum).
 */
export declare class RealfiSDKV1_0<P extends Provider, W extends Wallet> extends RealfiSDKV1Family<P, W, SettingsV1, VaultDatumV1> {
    readonly version: "V1_0";
    /**
     * Create a V1_0 SDK instance.
     */
    static create<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: IRealfiSDKParamsV1_0): RealfiSDKV1_0<P, W>;
    protected settingsConfig(settings: SettingsV1): TV1SettingsConfig;
    protected settingsRegistry(settings: SettingsV1): RegistryV1;
    protected buildInitialVaultDatum(): VaultDatumV1;
    protected buildUpdatedVaultDatum(previous: VaultDatumV1, sUSDrDelta: bigint): VaultDatumV1;
}
//# sourceMappingURL=index.d.ts.map