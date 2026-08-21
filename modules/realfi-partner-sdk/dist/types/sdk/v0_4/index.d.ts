import { PlutusData } from "@blaze-cardano/core";
import type { Provider } from "@blaze-cardano/query";
import { type Blaze, Core, TxBuilder, type Wallet } from "@blaze-cardano/sdk";
import { V0_4Types } from "../../generated-types/index.js";
import { TreasuryDatum as V0_1TreasuryDatum } from "../../generated-types/v0_1/index.js";
import type { Destination, MultisigScript, ProxyDatum, VaultDatum } from "../../generated-types/v0_4/index.js";
import { buildTimelockAddress, buildTimelockNativeScript, type IProxyDatumResult, type IRealfiSDKWithTreasury, type ITreasuryDatumResult, type IVaultDatumResult, type TClientSource, type TProtocolVersion, RealfiSDKBase } from "../shared/index.js";
export interface IRealfiSDKParamsV0_4 {
    version: "V0_4";
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
    clientSource?: TClientSource;
}
/**
 * V0_4 SDK implementation.
 *
 * Extends the protocol with staking (USDr->sUSDr), unstaking (sUSDr->USDr),
 * multi-reserve assets, deposit with interest splitting, and index-based optimization.
 * All order types (mint, burn, deposit, withdraw, stake, unstake) are request-based.
 */
export declare class RealfiSDKV0_4<P extends Provider, W extends Wallet> extends RealfiSDKBase<P, W> implements IRealfiSDKWithTreasury {
    readonly version: "V0_4";
    readonly stablecoinPolicyId: Core.PolicyId;
    readonly oneShotPolicyId: Core.PolicyId;
    readonly protocolScriptHash: Core.Hash28ByteBase16;
    readonly treasuryScriptHash: Core.Hash28ByteBase16;
    readonly treasuryNFTAssetId: Core.AssetId;
    readonly orderScriptHash: Core.Hash28ByteBase16;
    readonly orderScriptAddress: Core.Address;
    readonly treasuryAddress: Core.Address;
    readonly stakingVaultScriptHash: Core.Hash28ByteBase16;
    readonly stakingVaultAddress: Core.Address;
    readonly stakingVaultNFTAssetId: Core.AssetId;
    readonly sUSDrAssetNameHex: string;
    protected readonly oneShotScript: Core.Script;
    protected readonly protocolScript: Core.Script;
    protected readonly mintProxyScript: Core.Script;
    protected readonly treasuryScript: Core.Script;
    protected readonly orderScript: Core.Script;
    protected readonly stakingVaultScript: Core.Script;
    private constructor();
    /**
     * Create a V0_4 SDK instance.
     */
    static create<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: IRealfiSDKParamsV0_4): RealfiSDKV0_4<P, W>;
    /**
     * Mint the treasury NFT.
     */
    mintTreasuryNFT(treasuryBootstrapUtxo: Core.TransactionUnspentOutput, initialDatum?: V0_1TreasuryDatum): Promise<{
        tx: TxBuilder;
        nftAssetId: Core.AssetId;
    }>;
    deployTreasury(): Promise<TxBuilder>;
    deployOrderContract(): Promise<TxBuilder>;
    getTreasuryDatum(): Promise<ITreasuryDatumResult<V0_1TreasuryDatum>>;
    /**
     * Mint the staking vault NFT and create initial vault UTxO.
     */
    mintStakingVaultNFT(stakingVaultBootstrapUtxo: Core.TransactionUnspentOutput, initialDatum?: VaultDatum): Promise<{
        tx: TxBuilder;
        nftAssetId: Core.AssetId;
    }>;
    deployStakingVault(): Promise<TxBuilder>;
    /** The sUSDr asset ID (stablecoin policy + staked-USDr asset name). */
    getSusdrAssetId(): Core.AssetId;
    getVaultDatum(): Promise<IVaultDatumResult<VaultDatum>>;
    mintOneShot(receiverAddress: Core.Address, datum: ProxyDatum): Promise<{
        tx: TxBuilder;
        policyId: Core.PolicyId;
    }>;
    updateOneShotDatum(receiverAddress: Core.Address, newDatum: ProxyDatum): Promise<TxBuilder>;
    getParsedProxyDatum(): Promise<IProxyDatumResult<ProxyDatum>>;
    /**
     * Internal helper to build an order transaction.
     */
    private _buildOrderTx;
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
     * Build a deposit order: lock reserve tokens, request treasury deposit.
     */
    buildDepositOrderTx(params: {
        principal: bigint;
        yield: bigint;
        reserveAsset: [string, string];
        destination: Destination;
        owner?: MultisigScript;
        data?: PlutusData;
    }): Promise<TxBuilder>;
    /**
     * Build a withdraw order: lock min ADA, request reserve token withdrawal.
     */
    buildWithdrawOrderTx(params: {
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
    /**
     * Build an unstake order: lock sUSDr, request USDr release.
     *
     * The destination is automatically set to a native script address that
     * enforces a timelock: AllOf { Signature(user), After(unlockTime) }.
     * This means the released USDr can only be spent by the user after the
     * unlock time has passed.
     *
     * @param params.amount - Amount of sUSDr to unstake
     * @param params.destination - The user's actual destination (used to extract payment key hash)
     * @param params.unlockTime - Slot number after which the user can spend the released USDr
     */
    buildUnstakeOrderTx(params: {
        amount: bigint;
        destination: Destination;
        unlockSlot: bigint;
        owner?: MultisigScript;
        data?: PlutusData;
    }): Promise<TxBuilder>;
    /**
     * Build a timelock Destination from a user's destination and unlock time.
     *
     * Creates a native script: AllOf { Signature(userKeyHash), After(unlockTime) }
     * and returns a Destination pointing to that script's address.
     */
    static buildTimelockNativeScript: typeof buildTimelockNativeScript;
    static buildTimelockAddress: typeof buildTimelockAddress;
    /**
     * Build the V0_4 SignedPayload_ProtocolRedeemer from order inputs.
     * Returns both the CBOR hex string (for buildExecuteOrdersTx) and
     * the blake2b_256 hash (for CIP-30 signing).
     *
     * V0.4 contract requires signing the blake2b_256 hash of the payload,
     * not the raw CBOR like V0.3.
     */
    getSignedPayloadFromOrderInputs(orderInputs: Core.TransactionInput[]): Promise<{
        signedPayload: string;
        payloadHash: string;
    }>;
    /**
     * Build a transaction to execute orders.
     *
     * Handles all 6 action types: mint, burn, deposit, withdraw, stake, unstake.
     * The signedPayload is a CBOR hex string (matching V0.3 style).
     *
     * NOTE: All wallet fee inputs are pre-added to the transaction so that
     * input indices for the ExtraProtocolRedeemer are stable. Coin selection
     * during complete() should be a no-op since all wallet UTxOs are already
     * included, but it cannot be disabled because Blaze also uses that phase
     * to prepare collateral.
     */
    buildExecuteOrdersTx(params: {
        orderInputs: Core.TransactionInput[];
        signedPayload: string;
        signatures: V0_4Types.Tuple_VerificationKey_COSESign1[];
    }): Promise<TxBuilder>;
    private realignSpendRedeemerIndices;
    /**
     * Mint: reserve goes to treasury, USDr minted to destinations.
     */
    private buildMintExecute;
    /**
     * Burn: USDr burned, reserve sent to destinations.
     */
    private buildBurnExecute;
    /**
     * Withdraw: reserve sent to destinations, no mint/burn.
     */
    private buildWithdrawExecute;
    /**
     * Deposit: reserve deposited, interest USDr minted and split between vault and yield pot.
     */
    private buildDepositExecute;
    /**
     * Stake: USDr locked in vault, sUSDr minted to destinations.
     */
    private buildStakeExecute;
    /**
     * Unstake: sUSDr burned, USDr sent to user's destination address.
     */
    private buildUnstakeExecute;
    /**
     * Build a transaction to cancel orders.
     */
    buildCancelOrdersTx(params: {
        orderInputs: Core.TransactionInput[];
        destination?: Core.Address;
        /**
         * Optional set of key hashes that the caller can sign with.
         * When provided, only these keys are added as required signers —
         * essential for AnyOf/AtLeast multisig owners where not all keys
         * need to sign. When omitted, all extracted key hashes are added
         * (correct for Signature and AllOf owners, but over-constrains
         * AnyOf/AtLeast).
         */
        availableSigners?: Set<string>;
        versionHint?: TProtocolVersion;
    }): Promise<TxBuilder>;
    /**
     * Parse order UTxOs into IOrderInfo objects and validate they are all the same type.
     */
    private parseOrderInfos;
    /**
     * Classify an order action from its datum.
     */
    private classifyOrderAction;
    /**
     * Update treasury output with new reserve and circulating supply.
     */
    private updateTreasuryOutput;
    /**
     * Update vault output with new circulating_susdr and USDr balance.
     */
    private updateVaultOutput;
    /**
     * Get protocol settings from proxy datum (cached).
     */
    private getVersionSettings;
}
//# sourceMappingURL=index.d.ts.map