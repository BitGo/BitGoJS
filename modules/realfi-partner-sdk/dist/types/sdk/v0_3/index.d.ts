import { PlutusData } from "@blaze-cardano/core";
import type { Provider } from "@blaze-cardano/query";
import { type Blaze, Core, TxBuilder, type Wallet } from "@blaze-cardano/sdk";
import type { AssetAmount } from "@sundaeswap/asset";
import { TreasuryDatum as V0_1TreasuryDatum } from "../../generated-types/v0_1/index.js";
import type { Destination, MultisigScript, ProxyDatum, SignatureList } from "../../generated-types/v0_3/index.js";
import { type IProxyDatumResult, type IRealfiSDKWithTreasury, type ITreasuryDatumResult, type TProtocolVersion, RealfiSDKBase } from "../shared/index.js";
export interface IRealfiSDKParamsV0_3 {
    version: "V0_3";
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
        orderRefInput?: Core.TransactionUnspentOutput;
    };
}
/**
 * V0_3 SDK implementation.
 *
 * Extends V0_1 with deposit and withdraw operations for treasury management.
 * All operations (oneshot, protocol, mint proxy, treasury) are consolidated here.
 */
export declare class RealfiSDKV0_3<P extends Provider, W extends Wallet> extends RealfiSDKBase<P, W> implements IRealfiSDKWithTreasury {
    readonly version: "V0_3";
    readonly stablecoinPolicyId: Core.PolicyId;
    readonly oneShotPolicyId: Core.PolicyId;
    readonly protocolScriptHash: Core.Hash28ByteBase16;
    readonly treasuryScriptHash: Core.Hash28ByteBase16;
    readonly treasuryNFTAssetId: Core.AssetId;
    readonly orderScriptHash: Core.Hash28ByteBase16;
    readonly orderScriptAddress: Core.Address;
    readonly treasuryAddress: Core.Address;
    protected readonly oneShotScript: Core.Script;
    protected readonly protocolScript: Core.Script;
    protected readonly mintProxyScript: Core.Script;
    protected readonly treasuryScript: Core.Script;
    protected readonly orderScript: Core.Script;
    private constructor();
    /**
     * Create a V0_3 SDK instance.
     */
    static create<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: IRealfiSDKParamsV0_3): RealfiSDKV0_3<P, W>;
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
     * Deploy the Orders script as a reference script.
     */
    deployOrderContract(): Promise<TxBuilder>;
    /**
     * Get the treasury datum.
     */
    getTreasuryDatum(): Promise<ITreasuryDatumResult<V0_1TreasuryDatum>>;
    /**
     * Mint the one-shot NFT with the initial datum.
     * V0_3 uses ProxyDatum which includes withdraw/deposit permissions.
     */
    mintOneShot(receiverAddress: Core.Address, datum: ProxyDatum): Promise<{
        tx: TxBuilder;
        policyId: Core.PolicyId;
    }>;
    /**
     * Update the one-shot datum.
     */
    updateOneShotDatum(receiverAddress: Core.Address, newDatum: ProxyDatum): Promise<TxBuilder>;
    /**
     * Get the proxy datum from the one-shot token UTXO.
     * V0_3 returns ProxyDatum which includes withdraw/deposit permissions.
     * Result is cached after first fetch.
     */
    getParsedProxyDatum(): Promise<IProxyDatumResult<ProxyDatum>>;
    /**
     * Parse order UTXOs into IOrderInfo objects and validate they're all the same type.
     * @returns The parsed order infos and the action type (mint or burn)
     */
    private parseOrderInfos;
    /**
     * Calculate treasury state for order execution.
     * Validates that treasury has sufficient reserve tokens for burn operations.
     */
    private calculateTreasuryState;
    /**
     * Add destination outputs for executed orders.
     * For mints: sends stablecoins to destinations.
     * For burns: sends reserve tokens to destinations.
     */
    private addDestinationOutputs;
    /**
     * Update treasury with new reserve balance and circulating supply.
     */
    private updateTreasury;
    /**
     *
     * @param action "mint" | "burn"
     * @param amount amount of stablecoin to mint or burn
     * @param owner Optional owner multisig script. Defaults to the wallet's change address.
     * @param destination When minting, where to send the minted stablecoins. When burning, where to send the redeemed assets. A datum can be attached.
     * @param data Optional datum data. Defaults to Data.Void()
     * @returns TxBuilder
     */
    buildOrderTx({ action, amount, owner, destination, data, }: {
        action: "mint" | "burn";
        amount: bigint;
        owner?: MultisigScript;
        destination: Destination;
        data?: PlutusData;
    }): Promise<TxBuilder>;
    /**
     * Build the SignedPayload_ProtocolRedeemer from order inputs.
     * Returns CBOR hex string to be signed and included in SignedMessage.
     */
    getSignedPayloadFromOrderInputs(orderUtxos: Core.TransactionInput[]): Promise<string>;
    /**
     * Parse an order UTxO and extract action type, amount, and destination.
     */
    private parseOrderActionForPayload;
    /**
     * Build a Request from an order UTxO.
     * Serializes the origin (OutputReference) as CBOR to match Aiken's format.
     */
    private buildRequestFromUtxo;
    /**
     * Build a transaction to execute orders.
     * This consumes order UTXOs, validates the signed redeemer, mints/burns stablecoins,
     * and sends the results to the destinations specified in the orders.
     *
     * @param params.orderInputs - The order transaction inputs to execute
     * @param params.signedPayload - The signed payload hex string from getSignedPayloadFromOrderInputs
     * @param params.signatures - Array of signatures from each signer
     * @returns TxBuilder ready to be completed and signed
     */
    buildExecuteOrdersTx(params: {
        orderInputs: Core.TransactionInput[];
        signedPayload: string;
        signatures: SignatureList;
    }): Promise<TxBuilder>;
    /**
     * Build a transaction to cancel orders.
     * This returns the locked assets to the specified destination address.
     * The transaction must be signed by the owner(s) specified in each order's datum.
     *
     * @param params.orderInputs - The order transaction inputs to cancel
     * @param params.destination - Optional destination address. Defaults to the wallet's change address.
     * @returns TxBuilder ready to be completed and signed
     */
    buildCancelOrdersTx(params: {
        orderInputs: Core.TransactionInput[];
        destination?: Core.Address;
        versionHint?: TProtocolVersion;
    }): Promise<TxBuilder>;
    /**
     * Build a transaction to withdraw reserve tokens from the treasury.
     * The transaction must be signed by the authorized withdraw permission signers.
     *
     * @param params.requests - Array of withdraw requests with destinations and amounts
     * @param params.signedPayload - The signed payload hex string from getSignedPayloadForWithdraw
     * @param params.signatures - Array of KeySignature tuples from authorized signers
     * @returns TxBuilder ready to be completed and signed
     */
    /**
     * Build a withdraw transaction to remove reserve from the treasury.
     * @param amount Amount to withdraw from treasury
     * @param receiverAddress Address to send withdrawn assets to; defaults to wallet address
     */
    buildWithdrawTx(assetAmount: AssetAmount, receiverAddress?: string): Promise<TxBuilder>;
    buildDepositTx(assetAmount: AssetAmount): Promise<TxBuilder>;
}
//# sourceMappingURL=index.d.ts.map