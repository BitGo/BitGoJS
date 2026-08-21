import type { Provider } from "@blaze-cardano/query";
import { type Blaze, Core, TxBuilder, type Wallet } from "@blaze-cardano/sdk";
import { AssetAmount } from "@sundaeswap/asset";
import { V0_2Types } from "../../generated-types/index.js";
import { TreasuryDatum as V0_1TreasuryDatum } from "../../generated-types/v0_1/index.js";
import { type IProxyDatumResult, type IRealfiSDKWithTreasury, type ITreasuryDatumResult, RealfiSDKBase } from "../shared/index.js";
export interface IRealfiSDKParamsV0_2 {
    version: "V0_2";
    proxyBootstrap: {
        txHash: Core.TransactionId;
        outputIndex: bigint;
    };
    assetNameHex: string;
    /**
     * The treasury bootstrap UTxO reference. The treasury script and NFT asset ID
     * are derived from this reference and the stablecoin policy ID.
     */
    treasuryBootstrap: {
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
    };
}
/**
 * V0_2 SDK implementation.
 *
 * Extends V0_1 with deposit and withdraw operations for treasury management.
 * All operations (oneshot, protocol, mint proxy, treasury) are consolidated here.
 */
export declare class RealfiSDKV0_2<P extends Provider, W extends Wallet> extends RealfiSDKBase<P, W> implements IRealfiSDKWithTreasury {
    readonly version: "V0_2";
    readonly stablecoinPolicyId: Core.PolicyId;
    readonly oneShotPolicyId: Core.PolicyId;
    readonly protocolScriptHash: Core.Hash28ByteBase16;
    readonly treasuryScriptHash: Core.Hash28ByteBase16;
    readonly treasuryNFTAssetId: Core.AssetId;
    readonly treasuryAddress: Core.Address;
    protected readonly oneShotScript: Core.Script;
    protected readonly protocolScript: Core.Script;
    protected readonly mintProxyScript: Core.Script;
    protected readonly treasuryScript: Core.Script;
    private constructor();
    /**
     * Create a V0_2 SDK instance.
     */
    static create<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: IRealfiSDKParamsV0_2): RealfiSDKV0_2<P, W>;
    /**
     * Mint the treasury NFT.
     * This creates a new treasury with an initial datum.
     * The treasury bootstrap UTxO must be provided to consume it.
     */
    mintTreasuryNFT(treasuryBootstrapUtxo: Core.TransactionUnspentOutput, initialDatum?: V0_1TreasuryDatum): Promise<{
        tx: TxBuilder;
        nftAssetId: Core.AssetId;
    }>;
    /**
     * Deploy the treasury script as a reference script.
     */
    deployTreasury(): Promise<TxBuilder>;
    /**
     * Get the treasury datum.
     */
    getTreasuryDatum(): Promise<ITreasuryDatumResult<V0_1TreasuryDatum>>;
    /**
     * Mint the one-shot NFT with the initial datum.
     * V0_2 uses V0_2Types.ProxyDatum which includes withdraw/deposit permissions.
     */
    mintOneShot(receiverAddress: Core.Address, datum: V0_2Types.ProxyDatum): Promise<{
        tx: TxBuilder;
        policyId: Core.PolicyId;
    }>;
    /**
     * Update the one-shot datum.
     */
    updateOneShotDatum(receiverAddress: Core.Address, newDatum: V0_2Types.ProxyDatum): Promise<TxBuilder>;
    /**
     * Get the proxy datum from the one-shot token UTXO.
     * V0_2 returns V0_2Types.ProxyDatum which includes withdraw/deposit permissions.
     * Result is cached after first fetch.
     */
    getParsedProxyDatum(): Promise<IProxyDatumResult<V0_2Types.ProxyDatum>>;
    /**
     * Build a mint (positive amount) or burn (negative amount) transaction.
     * V0_2 minting uses V0_2Types.ProtocolRedeemer.
     */
    buildMintTx(assetAmount: AssetAmount): Promise<TxBuilder>;
    /**
     * Build a deposit transaction to add reserve to the treasury.
     */
    buildDepositTx(assetAmount: AssetAmount): Promise<TxBuilder>;
    /**
     * Build a withdraw transaction to remove reserve from the treasury.
     * @param amount Amount to withdraw from treasury
     * @param receiverAddress Address to send withdrawn assets to; defaults to wallet address
     */
    buildWithdrawTx(assetAmount: AssetAmount, receiverAddress?: string): Promise<TxBuilder>;
}
//# sourceMappingURL=index.d.ts.map