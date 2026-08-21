import { type TSchema } from "@blaze-cardano/data";
import type { Provider } from "@blaze-cardano/query";
import { Core, TxBuilder, type Blaze, type CIP30DataSignature, type Wallet } from "@blaze-cardano/sdk";
import { SignatureList, type Destination } from "src/generated-types/v0_3/index.js";
import { V0_3Types } from "../../generated-types/index.js";
import type { TMultisigScript, TProtocolVersion } from "./types.js";
type TDestinationCredentialLike = {
    VerificationKey: [string];
} | {
    Script: [string];
};
type TDestinationLike = {
    address: {
        payment_credential: TDestinationCredentialLike;
        stake_credential?: {
            Inline: [TDestinationCredentialLike];
        } | unknown;
    };
    datum: "NoDatum" | {
        DatumHash: [string];
    } | {
        InlineDatum: [Core.PlutusData | unknown];
    };
};
/**
 * Create a reward account from a script
 */
export declare function rewardAccountFromScript(script: Core.Script, network: Core.NetworkId): Core.RewardAccount;
/**
 * Create a credential from a script
 */
export declare function credentialFromScript(script: Core.Script): Core.Credential;
/**
 * Create a credential from a script hash
 */
export declare function credentialFromScriptHash(scriptHash: Core.Hash28ByteBase16): Core.Credential;
/**
 * Send a value (with an attached datum) to either a key-credentialled or
 * script-credentialled address. This helper emits an explicit output for
 * the destination address so callers (mintOneShot / updateOneShotDatum /
 * etc.) work transparently in both single-signer and multisig deployments.
 *
 * Mutates `tx` (matching Blaze's builder pattern) and returns it for chaining.
 */
export declare function lockOrPayAssets(tx: TxBuilder, address: Core.Address, value: Core.Value, datum: Core.PlutusData): TxBuilder;
/**
 * Add an explicit transaction output for the target address and value.
 *
 * Mutates `tx` and returns it for call sites that want to keep builder-style
 * chaining.
 */
export declare function addDirectOutput(tx: TxBuilder, address: Core.Address, value: Core.Value, datum?: Core.PlutusData): TxBuilder;
/**
 * Deploy a script as a reference script.
 *
 * When `address` is provided, the reference UTxO is locked at that address
 * (instead of Blaze's default burn address), which lets resolution query a
 * small, dedicated UTxO set rather than the shared burn address.
 *
 * Throws `ScriptAlreadyDeployedError` (carrying the existing reference
 * UTxO) if the script is already deployed *at the target location* — the
 * specified `address` when given, otherwise the burn-address default. The
 * guard is intentionally scoped to the deploy target only: a copy that
 * exists elsewhere (e.g. a legacy copy at the burn address) does NOT block
 * deploying to a newly specified address, which is exactly what a migration
 * needs. Callers that want idempotent reruns should catch that specific class.
 */
export declare function deployScript<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, script: Core.Script, address?: Core.Address): Promise<TxBuilder>;
/**
 * Look up an NFT UTxO, retrying indexer lag after the output moves.
 * Treats both a thrown 404 and an empty result as lag. Re-throws the last
 * provider error when the budget is exhausted.
 */
export declare function getUnspentOutputByNftWithRetry(provider: Provider, assetId: Core.AssetId): Promise<Core.TransactionUnspentOutput | undefined>;
/**
 * Read an NFT singleton (proxy, treasury, vault) and its datum.
 *
 * Protocol singletons are locked inline. A hash-form read is a provider
 * artifact (Blockfrost omitting `inline_datum`). Validators require
 * `InlineDatum` on the singleton input; passing the preimage as `addInput`'s
 * 3rd arg is a supplemental witness datum that local eval and phase-1 reject.
 * Resolve the hash, verify the preimage, and reattach it inline.
 *
 * The lookup is retried: a singleton always exists, so a not-found answer is
 * the provider's index lagging the UTxO's latest move, not a missing singleton.
 */
export declare function readSingletonDatum(provider: Provider, nftAssetId: Core.AssetId): Promise<{
    utxo: Core.TransactionUnspentOutput;
    datum: Core.PlutusData;
}>;
/**
 * Get datum from a UTxO containing a specific NFT, optionally parsed under
 * `datumSchema`. Datum-hash reads are repaired by {@link readSingletonDatum}.
 */
export declare function getDatumFromNFT<P extends Provider, W extends Wallet, T = unknown>(blaze: Blaze<P, W>, nftAssetId: Core.AssetId, datumSchema?: TSchema): Promise<{
    utxo: Core.TransactionUnspentOutput;
    datum: Core.PlutusData;
    parsedDatum: T;
}>;
/**
 * Get script reference inputs, using cached values when available.
 *
 * When `address` is provided, each script is resolved at that address first
 * (a fast, dedicated query) and only falls back to Blaze's burn-address
 * default if it isn't found there. This keeps previously burn-address-deployed
 * scripts resolvable while migrating to a specified deployment address.
 */
export declare function getReferenceInputs<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, scriptHashes: Record<string, Core.Hash28ByteBase16>, cachedInputs?: Partial<Record<string, Core.TransactionUnspentOutput>>, address?: Core.Address): Promise<Record<string, Core.TransactionUnspentOutput>>;
/**
 * Extract signature key hashes from a multisig script
 */
export declare const getSignatureKeyHashesFromMultisigScript: (multisig: TMultisigScript) => string[];
/**
 * Extract script key hashes from a multisig script
 */
export declare const getScriptKeyHashesFromMultisigScript: (multisig: TMultisigScript) => string[];
/**
 * Extract all key hashes (signature + script) from a multisig script
 */
export declare const getAllKeyHashesFromMultisigScript: (multisig: TMultisigScript) => string[];
/**
 * Sort order inputs by txHash and outputIndex for deterministic ordering.
 * This ensures consistent payload generation across all signers.
 */
export declare const sortOrderInputs: (orderInputs: Core.TransactionInput[]) => Core.TransactionInput[];
/**
 * Build a nonce from the first order UTxO.
 */
export declare const buildNonceFromUtxo: (utxo: Core.TransactionInput) => V0_3Types.Nonce;
/**
 * Build the origin ByteArray (CBOR-serialized OutputReference) from a UTxO.
 * Used by v0_4 SDK and shared helpers.
 */
export declare const buildOriginFromUtxo: (utxo: Core.TransactionUnspentOutput) => string;
/**
 * KeySignature type matching the contract's KeySignature tuple.
 * A tuple of [VerificationKey, COSESign1] where:
 * - VerificationKey: 32-byte Ed25519 public key (hex string)
 * - COSESign1: COSE signature with headers (raw CBOR bytes) and detached payload
 */
export type TKeySignature = [
    string,
    {
        headers: {
            protected: string;
            unprotected: string;
        };
        payload?: string;
        signature: string;
    }
];
export declare const destructureCip30Signature: (cip30Signature: CIP30DataSignature) => Promise<{
    publicKey: string;
    coseSign1: {
        headers: {
            protected: string;
            unprotected: string;
        };
        signature: string;
    };
}>;
/**
 * Produce a COSE (CIP-8) signature tuple over `payloadHash` using the connected
 * wallet's key. The reusable building block for signer callbacks — e.g. the
 * settings-governance `signAuthPayload` or an orchestrator signed redeemer —
 * that wraps `signData` + `destructureCip30Signature` into the on-chain tuple.
 */
export declare const signPayloadHashWithWallet: <P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, payloadHash: string) => Promise<TKeySignature>;
/**
 * Create a SignedRedeemer_ExtraProtocolRedeemer structure for on-chain verification.
 *
 * @param extra - The extra protocol redeemer data (e.g., request_to_outputs mapping)
 * @param payload - The SignedPayload_ProtocolRedeemer CBOR hex string (action + nonce)
 * @param signatures - Array of KeySignature tuples from each signer
 * @returns A SignedRedeemer_ExtraProtocolRedeemer ready for use in transaction
 */
export declare const createSignedRedeemer: (extra: V0_3Types.ExtraProtocolRedeemer, payload: string, signatures: SignatureList) => V0_3Types.SignedRedeemer_ExtraProtocolRedeemer;
/**
 * Parse a CIP-8 COSE_Sign1 and extract the pieces the on-chain KeySignature
 * tuple needs: the protected header map bytes (byte-string content, wrapper
 * removed) and the raw Ed25519 signature bytes.
 *
 * COSE_Sign1 = [ protected: bstr, unprotected: map, payload: bstr / nil,
 * signature: bstr ], optionally wrapped in CBOR tag 18. The protected element
 * is itself a byte string whose content is the serialized header map; reading
 * the byte-string content yields the raw header-map bytes the tuple stores.
 * Indefinite-length encodings of the array, the maps, and the byte strings
 * are accepted alongside the definite forms.
 */
export declare const readCoseSign1Parts: (coseSign1Hex: string) => {
    protected: string;
    signature: string;
};
/**
 * Build the SignedPayload_ProtocolRedeemer for a withdraw operation.
 * Uses the treasury UTxO as the nonce source.
 *
 * @param requests - Array of withdraw requests with destinations and amounts
 * @param treasuryUtxo - The treasury UTxO (consumed in tx, used as nonce)
 * @returns SignedPayload_ProtocolRedeemer CBOR hex string
 */
export declare const getSignedPayloadForWithdraw: (amount: bigint, treasuryUtxo: Core.TransactionUnspentOutput) => string;
/**
 * Build the SignedPayload_ProtocolRedeemer for a deposit operation.
 * Uses the treasury UTxO as the nonce source.
 *
 * @param amount - The amount of reserve tokens to deposit
 * @param treasuryUtxo - The treasury UTxO (consumed in tx, used as nonce)
 * @returns SignedPayload_ProtocolRedeemer CBOR hex string
 */
export declare const getSignedPayloadForDeposit: (amount: bigint, treasuryUtxo: Core.TransactionUnspentOutput) => string;
/**
 * Convert a Cardano address to a Destination type for order transactions.
 * Extracts payment and stake credentials from the address.
 *
 * @param address - The Cardano address to convert
 * @param datum - Optional datum for the destination (defaults to "NoDatum")
 * @returns A Destination object suitable for order transactions
 */
export declare function addressToDestination(address: Core.Address, datum?: Destination["datum"]): Destination;
/**
 * Convert a Destination-like value into a Cardano address.
 * Supports enterprise and base addresses. Pointer credentials are ignored.
 */
export declare function destinationToAddress(network: Core.NetworkId, destination: TDestinationLike): Core.Address;
/**
 * Add an output for a Destination, including script-payment addresses and
 * any datum metadata attached to the destination.
 *
 * Attaches the datum directly to a fresh TransactionOutput rather than
 * routing through Core.TransactionOutput.fromCore, because generated
 * TPlutusData values from @blaze-cardano/data are already Blaze
 * PlutusData instances and PlutusData.fromCore does not know how to
 * decode them (throws NotImplementedError).
 */
export declare function addDestinationOutput(tx: TxBuilder, network: Core.NetworkId, destination: TDestinationLike, value: Core.Value): void;
/**
 * Normalize externally-sourced protocol/order version strings into the SDK's
 * canonical `TProtocolVersion` values.
 */
export declare const normalizeProtocolVersion: (version: string | null | undefined) => TProtocolVersion | undefined;
/**
 * Alias for frontend order-version sources (GraphQL/backend strings).
 */
export declare const normalizeOrderVersion: (version: string | null | undefined) => TProtocolVersion | undefined;
/**
 * Extract the inline datum from a UTxO.
 */
export declare const getInlineDatumFromUtxo: (utxo: Core.TransactionUnspentOutput, label?: string) => Core.PlutusData;
/**
 * Extract the payment script hash from an order UTxO's output address.
 */
export declare const getScriptHashFromOrderUtxo: (utxo: Core.TransactionUnspentOutput) => Core.Hash28ByteBase16;
/**
 * Resolve one reference input per unique script hash.
 */
export declare function resolveReferenceInputsByScriptHash<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, scriptHashes: Iterable<Core.Hash28ByteBase16>, cachedInputs?: ReadonlyMap<Core.Hash28ByteBase16, Core.TransactionUnspentOutput> | Partial<Record<string, Core.TransactionUnspentOutput>>, address?: Core.Address): Promise<Map<Core.Hash28ByteBase16, Core.TransactionUnspentOutput>>;
/**
 * Resolve the order reference inputs needed to spend a batch of order UTxOs.
 */
export declare function resolveOrderReferenceInputs<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, orderUtxos: Iterable<Core.TransactionUnspentOutput>, cachedInputs?: ReadonlyMap<Core.Hash28ByteBase16, Core.TransactionUnspentOutput> | Partial<Record<string, Core.TransactionUnspentOutput>>, address?: Core.Address): Promise<Map<Core.Hash28ByteBase16, Core.TransactionUnspentOutput>>;
/**
 * Strict owner-only parser for order datums used by cross-version cancel.
 *
 * All currently-supported order datum variants encode as:
 * Constr(0, [owner, destination, action, data]).
 */
export declare const parseOrderOwnerGenericFromDatum: (datum: Core.PlutusData) => TMultisigScript;
/**
 * Strict owner-only parser for cancel flows.
 */
export declare const parseOrderOwnerGeneric: (utxo: Core.TransactionUnspentOutput) => TMultisigScript;
export {};
//# sourceMappingURL=utils.d.ts.map