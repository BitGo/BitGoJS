import * as Data from "@blaze-cardano/data";
import type { Provider } from "@blaze-cardano/query";
import { type Blaze, Core, TxBuilder, type Wallet } from "@blaze-cardano/sdk";
import { AssetAmount } from "@sundaeswap/asset";
import { type IProxyDatumResult, RealfiSDKBase } from "../shared/index.js";
/**
 * V0 datum type - simple datum with logic hash and no settings
 */
export declare const AdminDatum: Data.TObject<{
    logic: Data.TString;
    settings: Data.TVoid;
}>;
export type TAdminDatumType = {
    logic: string;
    settings: void;
};
export interface IRealfiSDKParamsV0 {
    version: "V0";
    proxyBootstrap: {
        txHash: Core.TransactionId;
        outputIndex: bigint;
    };
    assetNameHex: string;
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
    };
}
/**
 * V0 SDK implementation.
 *
 * Simple minting without treasury management.
 * All operations (oneshot, protocol, mint proxy) are consolidated here.
 */
export declare class RealfiSDKV0<P extends Provider, W extends Wallet> extends RealfiSDKBase<P, W> {
    readonly version: "V0";
    readonly stablecoinPolicyId: Core.PolicyId;
    readonly oneShotPolicyId: Core.PolicyId;
    readonly protocolScriptHash: Core.Hash28ByteBase16;
    protected readonly oneShotScript: Core.Script;
    protected readonly protocolScript: Core.Script;
    protected readonly mintProxyScript: Core.Script;
    private constructor();
    /**
     * Create a V0 SDK instance.
     */
    static create<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: IRealfiSDKParamsV0): RealfiSDKV0<P, W>;
    /**
     * Mint the one-shot NFT with the initial datum.
     * This consumes the bootstrap UTXO and can only be done once.
     */
    mintOneShot(receiverAddress: Core.Address, datum: TAdminDatumType): Promise<{
        tx: TxBuilder;
        policyId: Core.PolicyId;
    }>;
    /**
     * Update the one-shot datum.
     * This spends the one-shot UTXO and sends it back to the receiver with new datum.
     */
    updateOneShotDatum(receiverAddress: Core.Address, newDatum: TAdminDatumType): Promise<TxBuilder>;
    /**
     * Get the proxy datum from the one-shot token UTXO.
     * Result is cached after first fetch.
     */
    getParsedProxyDatum(): Promise<IProxyDatumResult<TAdminDatumType>>;
    /**
     * Build a mint (positive amount) or burn (negative amount) transaction.
     * V0 minting is simple - no treasury involvement.
     */
    buildMintTx(amount: AssetAmount): Promise<TxBuilder>;
}
//# sourceMappingURL=index.d.ts.map