import { PlutusData } from "@blaze-cardano/core";
import type { Provider } from "@blaze-cardano/query";
import { type Blaze, Core, TxBuilder, type Wallet } from "@blaze-cardano/sdk";
import { V1_0Rc1Types } from "../../generated-types/index.js";
import type { TreasuryDatum as V0_1TreasuryDatum } from "../../generated-types/v0_1/index.js";
import type { Destination, MultisigScript, OrderDatumV1, RegistryV1, SettingsV1, VaultDatumV1 } from "../../generated-types/v1_0_rc1/index.js";
import { RealfiSDKV1Family, type IBuildStakeContinuationParams, type IStakeContinuation, type IOrderInfo, type TOrderActionType } from "../v1/family.js";
import type { TV1SettingsConfig } from "../v1/types.js";
/**
 * Sentinel `reserve_asset` used in V1_0_Rc1 TreasuryRequestV1 redeemers for
 * DirectMint and DirectBurn actions, which have no real reserve asset in
 * their order datum. The on-chain validators `direct_mint_logic` and
 * `direct_burn_logic` do not inspect this field; this sentinel makes the
 * intent explicit both in code and when inspecting on-chain redeemers.
 *
 * - `policy_id`: 28 zero bytes (standard policy-ID length, chosen as a
 *   sentinel and extremely unlikely to occur as a real script hash)
 * - `asset_name`: "unused" (ASCII)
 *
 * Keep in sync with backend `contract.DirectActionPaddingAsset`.
 */
export declare const DIRECT_ACTION_PADDING_ASSET: V1_0Rc1Types.Asset;
export interface ITreasuryUnstakeOrderTxResultRc1 {
    /** Transaction builder for the treasury unstake order. */
    tx: TxBuilder;
    /**
     * Native script used as the unstake output destination:
     * AllOf { After(unlockSlot), owner }.
     */
    nativeScript: Core.NativeScript;
}
export interface IRealfiSDKParamsV1_0Rc1 {
    version: "V1_0_Rc1";
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
     * IV1FamilyConstructorParams.deployedValidators.
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
 * V1_0Rc1 SDK implementation.
 *
 * Extends V0_4 with:
 * - DirectMint/DirectBurn: Mint/burn USDr without reserve asset flow (for fiat wire scenarios)
 * - Invalidated redeemer: Allow order owners to recover funds when protocol is upgraded
 * - Forfeit parameter: Support yield forfeiture during unstake operations
 * - New Settings fields: direct_mint_permission, direct_burn_permission
 *
 * Scaffolding (scripts, deploy/register, treasury, vault, one-shot, cancel,
 * invalidate) is inherited from {@link RealfiSDKV1Family}. The release
 * candidate's protocol redeemer schema is structurally different from v1_0
 * (`TreasuryRequestV1[]` + `RequestV1[]`, no fees, no `min_received`), so the
 * order builders, signed-payload construction, and execute builders override
 * the family's v1_0-semantics defaults with the rc1 behavior verbatim. No
 * signing schemas are passed to the family constructor — both consumers are
 * overridden here.
 */
export declare class RealfiSDKV1_0Rc1<P extends Provider, W extends Wallet> extends RealfiSDKV1Family<P, W, SettingsV1, VaultDatumV1> {
    readonly version: "V1_0_Rc1";
    /**
     * Create a V1_0Rc1 SDK instance.
     */
    static create<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: IRealfiSDKParamsV1_0Rc1): RealfiSDKV1_0Rc1<P, W>;
    protected settingsConfig(settings: SettingsV1): TV1SettingsConfig;
    protected settingsRegistry(settings: SettingsV1): RegistryV1;
    protected buildInitialVaultDatum(): VaultDatumV1;
    protected buildUpdatedVaultDatum(previous: VaultDatumV1, sUSDrDelta: bigint): VaultDatumV1;
    buildStakeContinuation(_params: IBuildStakeContinuationParams): Promise<IStakeContinuation>;
    /**
     * Internal helper to build an order transaction.
     */
    protected _buildOrderTx(params: {
        action: V1_0Rc1Types.OrderActionV1;
        valueToLock: Core.Value;
        destination: Destination;
        owner?: MultisigScript;
        data?: PlutusData;
        extraLabels?: Map<bigint, Core.Metadatum>;
    }): Promise<TxBuilder>;
    /**
     * Build a mint order: lock reserve tokens, request USDr minting.
     */
    buildMintOrderTx(params: {
        amount: bigint;
        reserveAsset: [string, string];
        destination: Destination;
        owner?: MultisigScript;
        data?: PlutusData;
    }): Promise<TxBuilder>;
    /**
     * Build a redeem (burn) order: lock USDr, request reserve token redemption.
     */
    buildRedeemOrderTx(params: {
        amount: bigint;
        reserveAsset: [string, string];
        destination: Destination;
        owner?: MultisigScript;
        data?: PlutusData;
    }): Promise<TxBuilder>;
    /**
     * Build a stake order: lock USDr, request sUSDr minting.
     */
    buildStakeOrderTx(params: {
        amount: bigint;
        destination: Destination;
        owner?: MultisigScript;
        data?: PlutusData;
    }): Promise<TxBuilder>;
    protected _buildUnstakeOrderTx(params: {
        amount: bigint;
        destination: Destination;
        forfeit?: bigint;
        owner?: MultisigScript;
        data?: PlutusData;
        extraLabels?: Map<bigint, Core.Metadatum>;
    }): Promise<TxBuilder>;
    /**
     * Build an unstake order: lock sUSDr, request USDr release.
     *
     * The destination is automatically set to a native script address that
     * enforces a timelock: AllOf { Signature(user), After(unlockSlot) }.
     * This means the released USDr can only be spent by the user after the
     * unlock time has passed.
     *
     * @param params.amount - Amount of sUSDr to unstake
     * @param params.destination - The user's actual destination (used to extract payment key hash)
     * @param params.unlockSlot - Slot number after which the user can spend the released USDr
     * @param params.forfeit - Optional amount of USDr to forfeit to yield pot (default: 0)
     */
    buildUnstakeOrderTx(params: {
        amount: bigint;
        destination: Destination;
        unlockSlot: bigint;
        forfeit?: bigint;
        owner?: MultisigScript;
        data?: PlutusData;
    }): Promise<TxBuilder>;
    /**
     * Build a treasury-managed unstake order that wraps the destination in a
     * native timelock script controlled by the order owner.
     *
     * The destination is set to: AllOf { After(unlockSlot), owner }. This keeps
     * treasury multisig ownership on the released USDr while enforcing the same
     * unlock slot used by the retail unstake helper. The owner must be convertible
     * to a Cardano native script.
     */
    buildTreasuryUnstakeOrderTx(params: {
        amount: bigint;
        destination: Destination;
        unlockSlot: bigint;
        forfeit?: bigint;
        owner: MultisigScript;
        data?: PlutusData;
    }): Promise<ITreasuryUnstakeOrderTxResultRc1>;
    /**
     * Build the V1_0Rc1 SignedPayload_ProtocolRedeemer from order inputs.
     * Returns both the CBOR hex string (for buildExecuteOrdersTx) and
     * the blake2b_256 hash (for CIP-30 signing).
     */
    getSignedPayloadFromOrderInputs(orderInputs: Core.TransactionInput[]): Promise<{
        signedPayload: string;
        payloadHash: string;
    }>;
    /**
     * Build a transaction to execute orders.
     *
     * Handles all 8 action types: mint, burn, deposit, withdraw, stake, unstake,
     * direct_mint, direct_burn.
     */
    buildExecuteOrdersTx(params: {
        orderInputs: Core.TransactionInput[];
        signedPayload: string;
        signatures: V1_0Rc1Types.Tuple_VerificationKey_COSESign1[];
    }): Promise<TxBuilder>;
    /**
     * Mint: reserve goes to treasury, USDr minted to destinations.
     */
    protected buildMintExecute(tx: TxBuilder, orderInfos: IOrderInfo[], stablecoinAssetId: Core.AssetId, treasuryUtxo: Core.TransactionUnspentOutput, parsedTreasuryDatum: V0_1TreasuryDatum, settings: SettingsV1): void;
    /**
     * Burn: USDr burned, reserve sent to destinations.
     */
    protected buildBurnExecute(tx: TxBuilder, orderInfos: IOrderInfo[], stablecoinAssetId: Core.AssetId, treasuryUtxo: Core.TransactionUnspentOutput, parsedTreasuryDatum: V0_1TreasuryDatum, settings: SettingsV1): void;
    /**
     * Withdraw: reserve sent to destinations, no mint/burn.
     */
    protected buildWithdrawExecute(tx: TxBuilder, orderInfos: IOrderInfo[], treasuryUtxo: Core.TransactionUnspentOutput, parsedTreasuryDatum: V0_1TreasuryDatum, settings: SettingsV1): void;
    /**
     * Deposit: reserve deposited, interest USDr minted and split between vault and yield pot.
     */
    protected buildDepositExecute(tx: TxBuilder, orderInfos: IOrderInfo[], stablecoinAssetId: Core.AssetId, treasuryUtxo: Core.TransactionUnspentOutput, parsedTreasuryDatum: V0_1TreasuryDatum, vaultUtxo: Core.TransactionUnspentOutput, parsedVaultDatum: VaultDatumV1, settings: SettingsV1): void;
    /**
     * Stake: USDr locked in vault, sUSDr minted to destinations.
     */
    protected buildStakeExecute(tx: TxBuilder, orderInfos: IOrderInfo[], stablecoinAssetId: Core.AssetId, sUSDrAssetId: Core.AssetId, vaultUtxo: Core.TransactionUnspentOutput, parsedVaultDatum: VaultDatumV1): void;
    /**
     * Unstake: sUSDr burned, USDr sent to user's destination address.
     * V1_0Rc1: Supports forfeit parameter - forfeited USDr goes to yield pot.
     */
    protected buildUnstakeExecute(tx: TxBuilder, orderInfos: IOrderInfo[], stablecoinAssetId: Core.AssetId, sUSDrAssetId: Core.AssetId, vaultUtxo: Core.TransactionUnspentOutput, parsedVaultDatum: VaultDatumV1, settings: SettingsV1): void;
    /**
     * DirectMint: Mint USDr without reserve asset flow.
     * USDr is minted to destinations, treasury circulating_supply increases.
     * NO reserve asset changes.
     */
    protected buildDirectMintExecute(tx: TxBuilder, orderInfos: IOrderInfo[], stablecoinAssetId: Core.AssetId, treasuryUtxo: Core.TransactionUnspentOutput, parsedTreasuryDatum: V0_1TreasuryDatum): void;
    /**
     * DirectBurn: Burn USDr without reserve asset flow.
     * USDr is burned, treasury circulating_supply decreases.
     * NO reserve asset changes, NO destination outputs (fiat sent off-chain).
     *
     * The `_stablecoinAssetId` parameter exists only to keep the override
     * signature compatible with the family's; rc1's direct-burn output is
     * min-ADA only and does not touch the stablecoin asset.
     */
    protected buildDirectBurnExecute(tx: TxBuilder, orderInfos: IOrderInfo[], _stablecoinAssetId: Core.AssetId, treasuryUtxo: Core.TransactionUnspentOutput, parsedTreasuryDatum: V0_1TreasuryDatum): void;
    /**
     * Classify an order action from its datum (rc1 actions carry no min_received).
     */
    protected classifyOrderAction(datum: OrderDatumV1): {
        actionType: TOrderActionType;
        amount: bigint;
        yield?: bigint;
        forfeit?: bigint;
        reserveAsset?: [string, string];
        isTreasuryAction: boolean;
    };
}
//# sourceMappingURL=index.d.ts.map