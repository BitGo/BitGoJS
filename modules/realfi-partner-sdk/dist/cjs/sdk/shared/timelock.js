"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UNSTAKE_METADATA_LABEL = exports.ORDER_ORIGIN_METADATA_LABEL = void 0;
exports.buildMultisigTimelockDestination = buildMultisigTimelockDestination;
exports.buildMultisigTimelockNativeScript = buildMultisigTimelockNativeScript;
exports.buildOrderOriginMetadata = buildOrderOriginMetadata;
exports.buildOrderOriginMetadatum = buildOrderOriginMetadatum;
exports.buildTimelockAddress = buildTimelockAddress;
exports.buildTimelockDestination = buildTimelockDestination;
exports.buildTimelockNativeScript = buildTimelockNativeScript;
exports.buildUnstakeMetadatum = buildUnstakeMetadatum;
exports.buildUnstakeOrderMetadata = buildUnstakeOrderMetadata;
exports.destinationToUnstakeMetadatum = destinationToUnstakeMetadatum;
exports.multisigScriptToNativeScript = multisigScriptToNativeScript;
exports.resolveTimelockNativeScript = resolveTimelockNativeScript;
var _core = require("@blaze-cardano/core");
var _sdk = require("@blaze-cardano/sdk");
function bigintToSlot(value, label) {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("".concat(label, " must be a non-negative safe integer"));
  }
  return _sdk.Core.Slot(Number(value));
}
function bigintToNativeScriptCount(value, label) {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("".concat(label, " must be a non-negative safe integer"));
  }
  return Number(value);
}
function timelockStartNativeScript(unlockSlot) {
  return _sdk.Core.NativeScript.newTimelockStart(new _sdk.Core.TimelockStart(bigintToSlot(unlockSlot, "unlockSlot")));
}

/**
 * Convert the protocol MultisigScript shape to a Cardano native script.
 *
 * The protocol's `Script` variant references an arbitrary script hash, which
 * native scripts cannot require directly, so this helper rejects it.
 */
function multisigScriptToNativeScript(multisig) {
  if ("Signature" in multisig) {
    var hash = _sdk.Core.Ed25519KeyHashHex(multisig.Signature.key_hash);
    return _sdk.Core.NativeScript.newScriptPubkey(new _sdk.Core.ScriptPubkey(hash));
  }
  if ("AllOf" in multisig) {
    return _sdk.Core.NativeScript.newScriptAll(new _sdk.Core.ScriptAll(multisig.AllOf.scripts.map(multisigScriptToNativeScript)));
  }
  if ("AnyOf" in multisig) {
    return _sdk.Core.NativeScript.newScriptAny(new _sdk.Core.ScriptAny(multisig.AnyOf.scripts.map(multisigScriptToNativeScript)));
  }
  if ("AtLeast" in multisig) {
    return _sdk.Core.NativeScript.newScriptNOfK(new _sdk.Core.ScriptNOfK(multisig.AtLeast.scripts.map(multisigScriptToNativeScript), bigintToNativeScriptCount(multisig.AtLeast.required, "AtLeast.required")));
  }
  if ("Before" in multisig) {
    return _sdk.Core.NativeScript.newTimelockExpiry(new _sdk.Core.TimelockExpiry(bigintToSlot(multisig.Before.time, "Before.time")));
  }
  if ("After" in multisig) {
    return timelockStartNativeScript(multisig.After.time);
  }
  if ("Script" in multisig) {
    throw new Error("MultisigScript Script variant cannot be converted to a native script");
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
function buildTimelockNativeScript(userKeyHash, unlockTime) {
  var pubkeyScript = _sdk.Core.NativeScript.newScriptPubkey(new _sdk.Core.ScriptPubkey(_sdk.Core.Ed25519KeyHashHex(userKeyHash)));
  var afterScript = timelockStartNativeScript(unlockTime);
  return _sdk.Core.NativeScript.newScriptAll(new _sdk.Core.ScriptAll([pubkeyScript, afterScript]));
}

/**
 * Build the native script used for treasury-managed unstake destinations.
 *
 * The script enforces: AllOf { After(unlockSlot), ownerMultisigScript }.
 */
function buildMultisigTimelockNativeScript(owner, unlockSlot) {
  return _sdk.Core.NativeScript.newScriptAll(new _sdk.Core.ScriptAll([timelockStartNativeScript(unlockSlot), multisigScriptToNativeScript(owner)]));
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
function resolveTimelockNativeScript(lockingAddress, ownerKeyHash, unlockSlot) {
  var paymentPart = lockingAddress.getProps().paymentPart;
  if (!paymentPart || paymentPart.type !== _sdk.Core.CredentialType.ScriptHash) {
    throw new Error("".concat(lockingAddress.toBech32(), " is not a script address, so it is not a timelock this wallet can claim"));
  }
  var candidates = [buildTimelockNativeScript(ownerKeyHash, unlockSlot), buildMultisigTimelockNativeScript({
    Signature: {
      key_hash: ownerKeyHash
    }
  }, unlockSlot)];
  var match = candidates.find(function (candidate) {
    return candidate.hash() === paymentPart.hash;
  });
  if (!match) {
    throw new Error("Script hash ".concat(paymentPart.hash, " is not a timelock this wallet can claim: ") + "neither timelock shape for owner ".concat(ownerKeyHash, " at unlock slot ").concat(unlockSlot, " produces it. ") + "A timelock requiring further keys must be claimed through the flow that created it.");
  }
  return match;
}

/**
 * Reconstruct the timelock address for a given user key hash, optional stake
 * credential, and unlock slot. Useful for querying the live UTxO set to
 * determine whether a claim has already been made.
 */
function buildTimelockAddress(networkId, userKeyHash, unlockSlot, stakeCredential) {
  var nativeScript = buildTimelockNativeScript(userKeyHash, unlockSlot);
  return (0, _core.addressFromCredentials)(networkId, _sdk.Core.Credential.fromCore({
    type: _sdk.Core.CredentialType.ScriptHash,
    hash: nativeScript.hash()
  }), stakeCredential);
}

/**
 * Build a destination that routes funds to a timelock native script while
 * preserving the original stake credential.
 */
function buildTimelockDestination(userDestination, unlockTime) {
  var paymentCred = userDestination.address.payment_credential;
  var userKeyHash;
  if ("VerificationKey" in paymentCred) {
    userKeyHash = paymentCred.VerificationKey[0];
  } else {
    throw new Error("Unstake destination must use a verification key payment credential");
  }
  var nativeScript = buildTimelockNativeScript(userKeyHash, unlockTime);
  var scriptHash = nativeScript.hash();
  return {
    address: {
      payment_credential: {
        Script: [scriptHash]
      },
      stake_credential: userDestination.address.stake_credential
    },
    datum: "NoDatum"
  };
}
function credentialToMetadatum(cred) {
  var map = new _sdk.Core.MetadatumMap();
  if ("VerificationKey" in cred) {
    map.insert(_sdk.Core.Metadatum.newText("VerificationKey"), _sdk.Core.Metadatum.newText(cred.VerificationKey[0]));
  } else {
    map.insert(_sdk.Core.Metadatum.newText("Script"), _sdk.Core.Metadatum.newText(cred.Script[0]));
  }
  return _sdk.Core.Metadatum.newMap(map);
}
function destinationToUnstakeMetadatum(destination) {
  var addressMap = new _sdk.Core.MetadatumMap();
  addressMap.insert(_sdk.Core.Metadatum.newText("payment_credential"), credentialToMetadatum(destination.address.payment_credential));
  var stakeCredential = destination.address.stake_credential;
  if (stakeCredential && "Inline" in stakeCredential) {
    var inlineMap = new _sdk.Core.MetadatumMap();
    inlineMap.insert(_sdk.Core.Metadatum.newText("Inline"), credentialToMetadatum(stakeCredential.Inline[0]));
    addressMap.insert(_sdk.Core.Metadatum.newText("stake_credential"), _sdk.Core.Metadatum.newMap(inlineMap));
  }
  return _sdk.Core.Metadatum.newMap(addressMap);
}

/** Label 55534472: unstake destination + unlock_time on every unstake order. */
var UNSTAKE_METADATA_LABEL = exports.UNSTAKE_METADATA_LABEL = 55534472n;

/** Build the metadatum for label 55534472 from a destination and unlock slot. */
function buildUnstakeMetadatum(destination, unlockSlot) {
  var unstakeMetaMap = new _sdk.Core.MetadatumMap();
  unstakeMetaMap.insert(_sdk.Core.Metadatum.newText("unlock_time"), _sdk.Core.Metadatum.newInteger(unlockSlot));
  unstakeMetaMap.insert(_sdk.Core.Metadatum.newText("destination"), destinationToUnstakeMetadatum(destination));
  return _sdk.Core.Metadatum.newMap(unstakeMetaMap);
}

/** Label 55534473: SDK builder origin + version on every order transaction. */
var ORDER_ORIGIN_METADATA_LABEL = exports.ORDER_ORIGIN_METADATA_LABEL = 55534473n;

/** Build the metadatum for label 55534473 from a source + version pair. */
function buildOrderOriginMetadatum(source, sdkVersion) {
  var map = new _sdk.Core.MetadatumMap();
  map.insert(_sdk.Core.Metadatum.newText("source"), _sdk.Core.Metadatum.newText(source));
  map.insert(_sdk.Core.Metadatum.newText("version"), _sdk.Core.Metadatum.newText(sdkVersion));
  return _sdk.Core.Metadatum.newMap(map);
}

/** Build a Metadata object containing only the origin label (55534473). */
function buildOrderOriginMetadata(source, sdkVersion) {
  var metadataMap = new Map();
  metadataMap.set(ORDER_ORIGIN_METADATA_LABEL, buildOrderOriginMetadatum(source, sdkVersion));
  return new _sdk.Core.Metadata(metadataMap);
}
function buildUnstakeOrderMetadata(destination, unlockSlot, source, sdkVersion) {
  var metadataMap = new Map();
  metadataMap.set(UNSTAKE_METADATA_LABEL, buildUnstakeMetadatum(destination, unlockSlot));
  metadataMap.set(ORDER_ORIGIN_METADATA_LABEL, buildOrderOriginMetadatum(source, sdkVersion));
  return new _sdk.Core.Metadata(metadataMap);
}

/**
 * Build a destination that routes funds to a treasury multisig timelock native
 * script while preserving the original stake credential.
 */
function buildMultisigTimelockDestination(destination, owner, unlockSlot) {
  var nativeScript = buildMultisigTimelockNativeScript(owner, unlockSlot);
  return {
    address: {
      payment_credential: {
        Script: [nativeScript.hash()]
      },
      stake_credential: destination.address.stake_credential
    },
    datum: "NoDatum"
  };
}
//# sourceMappingURL=timelock.js.map