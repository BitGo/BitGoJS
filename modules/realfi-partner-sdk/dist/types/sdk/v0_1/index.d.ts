import type { Provider } from "@blaze-cardano/query";
import { type Blaze, Core, TxBuilder, type Wallet } from "@blaze-cardano/sdk";
import { AssetAmount } from "@sundaeswap/asset";
import { V0_1Types } from "../../generated-types/index.js";
import type { TreasuryDatum as V0_1TreasuryDatum } from "../../generated-types/v0_1/index.js";
import { type IProxyDatumResult, type IRealfiSDKWithTreasury, type ITreasuryDatumResult, RealfiSDKBase } from "../shared/index.js";
export interface IRealfiSDKParamsV0_1 {
    version: "V0_1";
    proxyBootstrap: {
        txHash: Core.TransactionId;
        outputIndex: bigint;
    };
    assetNameHex: string;
    /**
     * The bootstrap UTXO reference for treasury script parameterization.
     * Treasury script and NFT are derived from this.
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
 * V0_1 SDK implementation.
 *
 * Includes treasury management, reserve backing, and circulating supply tracking.
 * All operations (oneshot, protocol, mint proxy, treasury) are consolidated here.
 */
export declare class RealfiSDKV0_1<P extends Provider, W extends Wallet> extends RealfiSDKBase<P, W> implements IRealfiSDKWithTreasury {
    readonly version: "V0_1";
    readonly stablecoinPolicyId: Core.PolicyId;
    readonly oneShotPolicyId: Core.PolicyId;
    readonly protocolScriptHash: Core.Hash28ByteBase16;
    readonly treasuryScriptHash: Core.Hash28ByteBase16;
    readonly treasuryNFTAssetId: Core.AssetId;
    protected readonly oneShotScript: Core.Script;
    protected readonly protocolScript: Core.Script;
    protected readonly mintProxyScript: Core.Script;
    protected readonly treasuryScript: Core.Script;
    private constructor();
    /**
     * Create a V0_1 SDK instance.
     */
    static create<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: IRealfiSDKParamsV0_1): RealfiSDKV0_1<P, W>;
    /**
     * Mint the treasury NFT.
     * This creates a new treasury with an initial datum.
     * Uses the treasury bootstrap UTXO that was provided when creating the SDK.
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
     * This consumes the bootstrap UTXO and can only be done once.
     */
    mintOneShot(receiverAddress: Core.Address, datum: V0_1Types.ProxyDatum): Promise<{
        tx: TxBuilder;
        policyId: Core.PolicyId;
    }>;
    /**
     * Update the one-shot datum.
     * This spends the one-shot UTXO and sends it back to the receiver with new datum.
     */
    updateOneShotDatum(receiverAddress: Core.Address, newDatum: V0_1Types.ProxyDatum): Promise<TxBuilder>;
    /**
     * Get the proxy datum from the one-shot token UTXO.
     * Result is cached after first fetch.
     */
    getParsedProxyDatum(): Promise<IProxyDatumResult<V0_1Types.ProxyDatum>>;
    /**
     * Build a mint (positive amount) or burn (negative amount) transaction.
     * V0_1 minting includes treasury update for circulating supply tracking.
     */
    buildMintTx(assetAmount: AssetAmount): Promise<TxBuilder>;
}
//# sourceMappingURL=index.d.ts.map