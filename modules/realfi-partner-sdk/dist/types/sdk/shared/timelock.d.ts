import { Core } from "@blaze-cardano/sdk";
import type { TClientSource } from "./client-id.js";
import type { TMultisigScript } from "./types.js";
type TDestinationCredentialLike = {
    VerificationKey: [string];
} | {
    Script: [string];
};
type TTimelockDestinationLike = {
    address: {
        payment_credential: TDestinationCredentialLike;
        stake_credential?: {
            Inline: [TDestinationCredentialLike];
        } | {
            Pointer: unknown;
        };
    };
};
/**
 * Convert the protocol MultisigScript shape to a Cardano native script.
 *
 * The protocol's `Script` variant references an arbitrary script hash, which
 * native scripts cannot require directly, so this helper rejects it.
 */
export declare function multisigScriptToNativeScript(multisig: TMultisigScript): Core.NativeScript;
/**
 * Build the native script used for timelock destinations after unstaking.
 *
 * The script enforces: AllOf { Signature(userKeyHash), After(unlockTime) }
 * meaning the user can only spend the locked USDr after the unlock time.
 *
 * Use this to reconstruct the script when spending from a timelock address.
 */
export declare function buildTimelockNativeScript(userKeyHash: string, unlockTime: bigint): Core.NativeScript;
/**
 * Build the native script used for treasury-managed unstake destinations.
 *
 * The script enforces: AllOf { After(unlockSlot), ownerMultisigScript }.
 */
export declare function buildMultisigTimelockNativeScript(owner: TMultisigScript, unlockSlot: bigint): Core.NativeScript;
/**
 * Pick the timelock native script that a UTxO is actually locked at.
 *
 * One owner key and one unlock slot yield two different scripts depending on
 * which flow created the timelock: the retail unstake path builds
 * `AllOf { Signature, After }` and the treasury/multisig path
 * `AllOf { After, Signature }`. Same requirements, different element order,
 * different hash. The locking address names the script, so it is the authority
 * on which one to provide — guessing produces a witness the ledger cannot
 * resolve (Sentry DAPP-58).
 *
 * Timelocks requiring keys beyond `ownerKeyHash` match neither candidate and
 * are rejected here, where the reason can be stated, rather than deep inside
 * transaction building.
 */
export declare function resolveTimelockNativeScript(lockingAddress: Core.Address, ownerKeyHash: string, unlockSlot: bigint): Core.NativeScript;
/**
 * Reconstruct the timelock address for a given user key hash, optional stake
 * credential, and unlock slot. Useful for querying the live UTxO set to
 * determine whether a claim has already been made.
 */
export declare function buildTimelockAddress(networkId: Core.NetworkId, userKeyHash: string, unlockSlot: bigint, stakeCredential?: Core.Credential): Core.Address;
/**
 * Build a destination that routes funds to a timelock native script while
 * preserving the original stake credential.
 */
export declare function buildTimelockDestination<T extends TTimelockDestinationLike>(userDestination: T, unlockTime: bigint): {
    address: {
        payment_credential: {
            Script: [string];
        };
        stake_credential: T["address"]["stake_credential"];
    };
    datum: "NoDatum";
};
export declare function destinationToUnstakeMetadatum(destination: TTimelockDestinationLike): Core.Metadatum;
/** Label 55534472: unstake destination + unlock_time on every unstake order. */
export declare const UNSTAKE_METADATA_LABEL = 55534472n;
/** Build the metadatum for label 55534472 from a destination and unlock slot. */
export declare function buildUnstakeMetadatum(destination: TTimelockDestinationLike, unlockSlot: bigint): Core.Metadatum;
/** Label 55534473: SDK builder origin + version on every order transaction. */
export declare const ORDER_ORIGIN_METADATA_LABEL = 55534473n;
/** Build the metadatum for label 55534473 from a source + version pair. */
export declare function buildOrderOriginMetadatum(source: TClientSource, sdkVersion: string): Core.Metadatum;
/** Build a Metadata object containing only the origin label (55534473). */
export declare function buildOrderOriginMetadata(source: TClientSource, sdkVersion: string): Core.Metadata;
export declare function buildUnstakeOrderMetadata(destination: TTimelockDestinationLike, unlockSlot: bigint, source: TClientSource, sdkVersion: string): Core.Metadata;
/**
 * Build a destination that routes funds to a treasury multisig timelock native
 * script while preserving the original stake credential.
 */
export declare function buildMultisigTimelockDestination<T extends TTimelockDestinationLike>(destination: T, owner: TMultisigScript, unlockSlot: bigint): {
    address: {
        payment_credential: {
            Script: [string];
        };
        stake_credential: T["address"]["stake_credential"];
    };
    datum: "NoDatum";
};
export {};
//# sourceMappingURL=timelock.d.ts.map