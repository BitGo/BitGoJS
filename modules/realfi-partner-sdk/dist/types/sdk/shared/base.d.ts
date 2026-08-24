import type { Provider } from "@blaze-cardano/query";
import { type Blaze, Core, TxBuilder, type Wallet } from "@blaze-cardano/sdk";
import { type TClientSource } from "./client-id.js";
import type { IBaseSDKParams, ICachedReferenceInputs, IOutputReference, IProxyDatumResult, IProxySettings, IRawProxyDatumResult, ITreasuryDatumResult, TProtocolVersion } from "./types.js";
/**
 * Base interface for SDK version implementations.
 * Each version implements this with version-specific logic.
 */
export interface IRealfiSDK {
    /** Protocol version */
    readonly version: TProtocolVersion;
    /** Stablecoin policy ID (mint proxy) */
    readonly stablecoinPolicyId: Core.PolicyId;
    /** One-shot NFT policy ID */
    readonly oneShotPolicyId: Core.PolicyId;
    /** Protocol script hash */
    readonly protocolScriptHash: Core.Hash28ByteBase16;
    /** Get the raw proxy UTxO + inline datum from the one-shot token UTXO */
    getRawProxyDatum(): Promise<IRawProxyDatumResult>;
    /** Get and parse the proxy datum using this SDK version's schema */
    getParsedProxyDatum(): Promise<IProxyDatumResult<unknown>>;
    /** @deprecated Use getParsedProxyDatum() or getRawProxyDatum() */
    getProxyDatum(): Promise<IProxyDatumResult<unknown>>;
    /** Deploy the protocol script */
    deployProtocol(): Promise<TxBuilder>;
    /** Deploy the mint proxy script */
    deployMintProxy(): Promise<TxBuilder>;
    /** Register the protocol stake credential */
    registerProtocolStake(): TxBuilder;
    /** Get the protocol reward account */
    getProtocolRewardAccount(): Core.RewardAccount;
    /** Mint the one-shot NFT with initial datum */
    mintOneShot(receiverAddress: Core.Address, datum: unknown): Promise<{
        tx: TxBuilder;
        policyId: Core.PolicyId;
    }>;
    /** Update the one-shot datum */
    updateOneShotDatum(receiverAddress: Core.Address, newDatum: unknown): Promise<TxBuilder>;
    /** Get version-agnostic proxy settings (common fields only) */
    getSettings(): Promise<IProxySettings>;
}
export interface IRealfiSDKWithTreasury extends IRealfiSDK {
    /** Treasury NFT asset ID */
    readonly treasuryNFTAssetId: Core.AssetId;
    /** Treasury script hash */
    readonly treasuryScriptHash: Core.Hash28ByteBase16;
    /** Mint the treasury NFT */
    mintTreasuryNFT(utxo?: Core.TransactionUnspentOutput): Promise<{
        tx: TxBuilder;
        nftAssetId: Core.AssetId;
    }>;
    /** Deploy the treasury script (requires original UTXO for script instantiation) */
    deployTreasury(utxo: Core.TransactionUnspentOutput): Promise<TxBuilder>;
    /** Get the treasury datum */
    getTreasuryDatum(): Promise<ITreasuryDatumResult<unknown>>;
}
/**
 * Abstract base class for SDK versions.
 * Provides common implementation and utilities.
 */
export declare abstract class RealfiSDKBase<P extends Provider, W extends Wallet> implements IRealfiSDK {
    /** Blaze instance for blockchain interactions */
    protected readonly blaze: Blaze<P, W>;
    /** Bootstrap parameters */
    protected readonly proxyBootstrap: IBaseSDKParams["proxyBootstrap"];
    /** Asset name hex for the stablecoin */
    protected readonly assetNameHex: string;
    /** Cached reference inputs for performance (populated on first fetch) */
    protected cachedReferenceInputs: ICachedReferenceInputs;
    /**
     * Address used to deploy reference scripts and to resolve them from.
     * When undefined, Blaze's burn address is used for both.
     */
    protected readonly scriptDeploymentAddress?: Core.Address;
    /** Cached raw proxy datum result (populated on first fetch) */
    protected cachedRawProxyDatumResult?: IRawProxyDatumResult;
    /** Cached parsed proxy datum result (populated on first fetch) */
    protected cachedProxyDatumResult?: IProxyDatumResult<unknown>;
    /** One-shot output reference (derived from bootstrap) */
    protected readonly oneShotTxoRef: IOutputReference;
    /** Enable trace output in Plutus scripts */
    readonly enableTrace: boolean;
    /** Origin attached to all built order transactions. */
    readonly clientSource: TClientSource;
    /** SDK version attached to all built order transactions. */
    readonly sdkVersion: string;
    abstract readonly version: TProtocolVersion;
    abstract readonly stablecoinPolicyId: Core.PolicyId;
    abstract readonly oneShotPolicyId: Core.PolicyId;
    abstract readonly protocolScriptHash: Core.Hash28ByteBase16;
    protected abstract readonly oneShotScript: Core.Script;
    protected abstract readonly protocolScript: Core.Script;
    protected abstract readonly mintProxyScript: Core.Script;
    protected constructor(blaze: Blaze<P, W>, params: IBaseSDKParams & {
        clientSource?: TClientSource;
    }, cachedReferenceInputs?: ICachedReferenceInputs);
    /** Get the network from blaze */
    protected get network(): Core.NetworkId;
    /**
     * Start a transaction with a single setMetadata call. Origin label (55534473) is always
     * present and not overridable; extra labels are merged in before the origin is set.
     */
    protected newOrderTransaction(extraLabels?: Map<bigint, Core.Metadatum>): TxBuilder;
    /**
     * Helper to get reference inputs for scripts.
     * Fetched values are cached for subsequent calls.
     */
    getScriptReferenceInputs(scriptHashes: Record<string, Core.Hash28ByteBase16>): Promise<Record<string, Core.TransactionUnspentOutput>>;
    /**
     * Resolve the bootstrap UTXO from the provider.
     * This will fail if the UTXO has already been consumed (i.e., the one-shot token was minted).
     */
    protected resolveBootstrapUtxo(): Promise<Core.TransactionUnspentOutput>;
    /**
     * Deploy the protocol script as a reference script.
     */
    deployProtocol(): Promise<TxBuilder>;
    /**
     * Deploy the mint proxy script as a reference script.
     */
    deployMintProxy(): Promise<TxBuilder>;
    /**
     * Register the protocol stake credential.
     */
    registerProtocolStake(): TxBuilder;
    /**
     * Get the protocol reward account.
     */
    getProtocolRewardAccount(): Core.RewardAccount;
    /**
     * Get version-agnostic proxy settings.
     * Extracts only the common fields shared across V0_2+ protocol versions.
     */
    getSettings(): Promise<IProxySettings>;
    /** The USDr asset ID (stablecoin policy + USDr asset name). */
    getUsdrAssetId(): Core.AssetId;
    /**
     * Build a transaction that claims USDr locked in a timelock address after
     * the unstake cooldown has expired.
     *
     * Reconstructs the timelock native script for the owner's key hash and the
     * original unlock slot, then spends the UTxO. `owner` is the timelock owner
     * (defaults to the connected wallet) and is set as the required signer, so a
     * custodian holding the user's key can claim. The released USDr goes to
     * `destination`, or to `owner` when only an owner is given; with neither it
     * returns to the connected wallet.
     *
     * A single owner key has two timelock shapes in the protocol, differing only
     * in element order: `buildUnstakeOrderTx` locks to
     * `AllOf { Signature, After }` and the treasury/multisig unstake path to
     * `AllOf { After, Signature }`. They hash differently, so which one applies
     * is read off the UTxO's own locking address rather than assumed.
     */
    buildClaimTimelockTx(params: {
        resultUtxo: {
            txHash: string;
            index: number;
        };
        unlockSlot: bigint;
        owner?: Core.Address;
        destination?: Core.Address;
    }): Promise<TxBuilder>;
    /**
     * Fetch the live proxy UTxO and inline datum without attempting a
     * version-specific parse. Cached after first fetch.
     *
     * `readSingletonDatum` both retries the lookup (a not-found answer is the
     * provider's index lagging the UTxO's latest move, not a missing proxy —
     * Blockfrost returns HTTP 404 in that window, Sentry TREASURY-ADMIN-API-G)
     * and repairs a datum the provider reports as a hash.
     */
    getRawProxyDatum(): Promise<IRawProxyDatumResult>;
    /**
     * @deprecated Use getParsedProxyDatum() or getRawProxyDatum() depending on
     * whether the caller needs a version-specific schema parse.
     */
    getProxyDatum(): Promise<IProxyDatumResult<unknown>>;
    abstract getParsedProxyDatum(): Promise<IProxyDatumResult<unknown>>;
    abstract mintOneShot(receiverAddress: Core.Address, datum: unknown): Promise<{
        tx: TxBuilder;
        policyId: Core.PolicyId;
    }>;
    abstract updateOneShotDatum(receiverAddress: Core.Address, newDatum: unknown): Promise<TxBuilder>;
}
//# sourceMappingURL=base.d.ts.map