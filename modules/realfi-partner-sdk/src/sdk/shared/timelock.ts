import { addressFromCredentials } from "@blaze-cardano/core";
import { Core } from "@blaze-cardano/sdk";
import type { TClientSource } from "./client-id.js";
import type { TMultisigScript } from "./types.js";

type TDestinationCredentialLike =
  | { VerificationKey: [string] }
  | { Script: [string] };

type TTimelockDestinationLike = {
  address: {
    payment_credential: TDestinationCredentialLike;
    stake_credential?:
      | { Inline: [TDestinationCredentialLike] }
      | { Pointer: unknown };
  };
};

function bigintToSlot(value: bigint, label: string): Core.Slot {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${label} must be a non-negative safe integer`);
  }
  return Core.Slot(Number(value));
}

function bigintToNativeScriptCount(value: bigint, label: string): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${label} must be a non-negative safe integer`);
  }
  return Number(value);
}

function timelockStartNativeScript(unlockSlot: bigint): Core.NativeScript {
  return Core.NativeScript.newTimelockStart(
    new Core.TimelockStart(bigintToSlot(unlockSlot, "unlockSlot")),
  );
}

/**
 * Convert the protocol MultisigScript shape to a Cardano native script.
 *
 * The protocol's `Script` variant references an arbitrary script hash, which
 * native scripts cannot require directly, so this helper rejects it.
 */
export function multisigScriptToNativeScript(
  multisig: TMultisigScript,
): Core.NativeScript {
  if ("Signature" in multisig) {
    const hash = Core.Ed25519KeyHashHex(multisig.Signature.key_hash);
    return Core.NativeScript.newScriptPubkey(new Core.ScriptPubkey(hash));
  }
  if ("AllOf" in multisig) {
    return Core.NativeScript.newScriptAll(
      new Core.ScriptAll(
        multisig.AllOf.scripts.map(multisigScriptToNativeScript),
      ),
    );
  }
  if ("AnyOf" in multisig) {
    return Core.NativeScript.newScriptAny(
      new Core.ScriptAny(
        multisig.AnyOf.scripts.map(multisigScriptToNativeScript),
      ),
    );
  }
  if ("AtLeast" in multisig) {
    return Core.NativeScript.newScriptNOfK(
      new Core.ScriptNOfK(
        multisig.AtLeast.scripts.map(multisigScriptToNativeScript),
        bigintToNativeScriptCount(
          multisig.AtLeast.required,
          "AtLeast.required",
        ),
      ),
    );
  }
  if ("Before" in multisig) {
    return Core.NativeScript.newTimelockExpiry(
      new Core.TimelockExpiry(
        bigintToSlot(multisig.Before.time, "Before.time"),
      ),
    );
  }
  if ("After" in multisig) {
    return timelockStartNativeScript(multisig.After.time);
  }
  if ("Script" in multisig) {
    throw new Error(
      "MultisigScript Script variant cannot be converted to a native script",
    );
  }

  throw new Error("Unrecognized MultisigScript variant");
}

/**
 * Build the native script used for timelock destinations after unstaking.
 *
 * The script enforces: AllOf { Signature(userKeyHash), After(unlockTime) }
 * meaning the user can only spend the locked USDr after the unlock time.
 *
 * Use this to reconstruct the script when spending from a timelock address.
 */
export function buildTimelockNativeScript(
  userKeyHash: string,
  unlockTime: bigint,
): Core.NativeScript {
  const pubkeyScript = Core.NativeScript.newScriptPubkey(
    new Core.ScriptPubkey(Core.Ed25519KeyHashHex(userKeyHash)),
  );
  const afterScript = timelockStartNativeScript(unlockTime);
  return Core.NativeScript.newScriptAll(
    new Core.ScriptAll([pubkeyScript, afterScript]),
  );
}

/**
 * Build the native script used for treasury-managed unstake destinations.
 *
 * The script enforces: AllOf { After(unlockSlot), ownerMultisigScript }.
 */
export function buildMultisigTimelockNativeScript(
  owner: TMultisigScript,
  unlockSlot: bigint,
): Core.NativeScript {
  return Core.NativeScript.newScriptAll(
    new Core.ScriptAll([
      timelockStartNativeScript(unlockSlot),
      multisigScriptToNativeScript(owner),
    ]),
  );
}

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
export function resolveTimelockNativeScript(
  lockingAddress: Core.Address,
  ownerKeyHash: string,
  unlockSlot: bigint,
): Core.NativeScript {
  const paymentPart = lockingAddress.getProps().paymentPart;
  if (!paymentPart || paymentPart.type !== Core.CredentialType.ScriptHash) {
    throw new Error(
      `${lockingAddress.toBech32()} is not a script address, so it is not a timelock this wallet can claim`,
    );
  }

  const candidates = [
    buildTimelockNativeScript(ownerKeyHash, unlockSlot),
    buildMultisigTimelockNativeScript(
      { Signature: { key_hash: ownerKeyHash } },
      unlockSlot,
    ),
  ];
  const match = candidates.find(
    (candidate) => candidate.hash() === paymentPart.hash,
  );
  if (!match) {
    throw new Error(
      `Script hash ${paymentPart.hash} is not a timelock this wallet can claim: ` +
        `neither timelock shape for owner ${ownerKeyHash} at unlock slot ${unlockSlot} produces it. ` +
        `A timelock requiring further keys must be claimed through the flow that created it.`,
    );
  }
  return match;
}

/**
 * Reconstruct the timelock address for a given user key hash, optional stake
 * credential, and unlock slot. Useful for querying the live UTxO set to
 * determine whether a claim has already been made.
 */
export function buildTimelockAddress(
  networkId: Core.NetworkId,
  userKeyHash: string,
  unlockSlot: bigint,
  stakeCredential?: Core.Credential,
): Core.Address {
  const nativeScript = buildTimelockNativeScript(userKeyHash, unlockSlot);
  return addressFromCredentials(
    networkId,
    Core.Credential.fromCore({
      type: Core.CredentialType.ScriptHash,
      hash: nativeScript.hash(),
    }),
    stakeCredential,
  );
}

/**
 * Build a destination that routes funds to a timelock native script while
 * preserving the original stake credential.
 */
export function buildTimelockDestination<T extends TTimelockDestinationLike>(
  userDestination: T,
  unlockTime: bigint,
): {
  address: {
    payment_credential: { Script: [string] };
    stake_credential: T["address"]["stake_credential"];
  };
  datum: "NoDatum";
} {
  const paymentCred = userDestination.address.payment_credential;
  let userKeyHash: string;

  if ("VerificationKey" in paymentCred) {
    userKeyHash = paymentCred.VerificationKey[0];
  } else {
    throw new Error(
      "Unstake destination must use a verification key payment credential",
    );
  }

  const nativeScript = buildTimelockNativeScript(userKeyHash, unlockTime);
  const scriptHash = nativeScript.hash();

  return {
    address: {
      payment_credential: { Script: [scriptHash] },
      stake_credential: userDestination.address.stake_credential,
    },
    datum: "NoDatum",
  };
}

function credentialToMetadatum(
  cred: TDestinationCredentialLike,
): Core.Metadatum {
  const map = new Core.MetadatumMap();
  if ("VerificationKey" in cred) {
    map.insert(
      Core.Metadatum.newText("VerificationKey"),
      Core.Metadatum.newText(cred.VerificationKey[0]),
    );
  } else {
    map.insert(
      Core.Metadatum.newText("Script"),
      Core.Metadatum.newText(cred.Script[0]),
    );
  }
  return Core.Metadatum.newMap(map);
}

export function destinationToUnstakeMetadatum(
  destination: TTimelockDestinationLike,
): Core.Metadatum {
  const addressMap = new Core.MetadatumMap();
  addressMap.insert(
    Core.Metadatum.newText("payment_credential"),
    credentialToMetadatum(destination.address.payment_credential),
  );

  const stakeCredential = destination.address.stake_credential;
  if (stakeCredential && "Inline" in stakeCredential) {
    const inlineMap = new Core.MetadatumMap();
    inlineMap.insert(
      Core.Metadatum.newText("Inline"),
      credentialToMetadatum(stakeCredential.Inline[0]),
    );
    addressMap.insert(
      Core.Metadatum.newText("stake_credential"),
      Core.Metadatum.newMap(inlineMap),
    );
  }

  return Core.Metadatum.newMap(addressMap);
}

/** Label 55534472: unstake destination + unlock_time on every unstake order. */
export const UNSTAKE_METADATA_LABEL = 55534472n;

/** Build the metadatum for label 55534472 from a destination and unlock slot. */
export function buildUnstakeMetadatum(
  destination: TTimelockDestinationLike,
  unlockSlot: bigint,
): Core.Metadatum {
  const unstakeMetaMap = new Core.MetadatumMap();
  unstakeMetaMap.insert(
    Core.Metadatum.newText("unlock_time"),
    Core.Metadatum.newInteger(unlockSlot),
  );
  unstakeMetaMap.insert(
    Core.Metadatum.newText("destination"),
    destinationToUnstakeMetadatum(destination),
  );
  return Core.Metadatum.newMap(unstakeMetaMap);
}

/** Label 55534473: SDK builder origin + version on every order transaction. */
export const ORDER_ORIGIN_METADATA_LABEL = 55534473n;

/** Build the metadatum for label 55534473 from a source + version pair. */
export function buildOrderOriginMetadatum(
  source: TClientSource,
  sdkVersion: string,
): Core.Metadatum {
  const map = new Core.MetadatumMap();
  map.insert(Core.Metadatum.newText("source"), Core.Metadatum.newText(source));
  map.insert(
    Core.Metadatum.newText("version"),
    Core.Metadatum.newText(sdkVersion),
  );
  return Core.Metadatum.newMap(map);
}

/** Build a Metadata object containing only the origin label (55534473). */
export function buildOrderOriginMetadata(
  source: TClientSource,
  sdkVersion: string,
): Core.Metadata {
  const metadataMap = new Map<bigint, Core.Metadatum>();
  metadataMap.set(
    ORDER_ORIGIN_METADATA_LABEL,
    buildOrderOriginMetadatum(source, sdkVersion),
  );
  return new Core.Metadata(metadataMap);
}

export function buildUnstakeOrderMetadata(
  destination: TTimelockDestinationLike,
  unlockSlot: bigint,
  source: TClientSource,
  sdkVersion: string,
): Core.Metadata {
  const metadataMap = new Map<bigint, Core.Metadatum>();
  metadataMap.set(
    UNSTAKE_METADATA_LABEL,
    buildUnstakeMetadatum(destination, unlockSlot),
  );
  metadataMap.set(
    ORDER_ORIGIN_METADATA_LABEL,
    buildOrderOriginMetadatum(source, sdkVersion),
  );
  return new Core.Metadata(metadataMap);
}

/**
 * Build a destination that routes funds to a treasury multisig timelock native
 * script while preserving the original stake credential.
 */
export function buildMultisigTimelockDestination<
  T extends TTimelockDestinationLike,
>(
  destination: T,
  owner: TMultisigScript,
  unlockSlot: bigint,
): {
  address: {
    payment_credential: { Script: [string] };
    stake_credential: T["address"]["stake_credential"];
  };
  datum: "NoDatum";
} {
  const nativeScript = buildMultisigTimelockNativeScript(owner, unlockSlot);
  return {
    address: {
      payment_credential: { Script: [nativeScript.hash()] },
      stake_credential: destination.address.stake_credential,
    },
    datum: "NoDatum",
  };
}
