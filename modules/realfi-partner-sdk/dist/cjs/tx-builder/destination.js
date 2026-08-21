"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addressToRealFiDestination = addressToRealFiDestination;
exports.inlineDatumFromStepResult = inlineDatumFromStepResult;
exports.plutusDataFromCbor = plutusDataFromCbor;
exports.realfiDestinationDatumFromStepResult = realfiDestinationDatumFromStepResult;
exports.realfiDestinationFromStepResult = realfiDestinationFromStepResult;
exports.realfiDestinationToAddress = realfiDestinationToAddress;
exports.realfiOwnerFromSundaeV3OwnerAddress = realfiOwnerFromSundaeV3OwnerAddress;
exports.sundaeV3DestinationAddressFromStepResult = sundaeV3DestinationAddressFromStepResult;
exports.sundaeV3DestinationDatumFromStepResult = sundaeV3DestinationDatumFromStepResult;
exports.sundaeV3DestinationFromStepResult = sundaeV3DestinationFromStepResult;
var _core = require("@blaze-cardano/core");
var _sdk = require("@blaze-cardano/sdk");
var _core2 = require("@sundaeswap/core");
/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Intermediate output produced by one flow step and consumed by the previous
 * flow step as its continuation destination.
 */

/**
 * Converts a step result's optional inline datum into the RealFi destination
 * datum shape.
 */
function realfiDestinationDatumFromStepResult(stepResult) {
  return stepResult.datum ? {
    InlineDatum: [stepResult.datum]
  } : "NoDatum";
}

/**
 * Builds a RealFi destination that points to a step result's address and datum.
 */
function realfiDestinationFromStepResult(stepResult) {
  return addressToRealFiDestination(stepResult.address, realfiDestinationDatumFromStepResult(stepResult));
}

/**
 * Converts a Cardano address plus optional datum into the generated RealFi
 * destination type.
 */
function addressToRealFiDestination(address) {
  var datum = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "NoDatum";
  var props = address.getProps();
  var paymentPart = props.paymentPart;
  if (!paymentPart) {
    throw new Error("Address must have a payment part");
  }
  var paymentCredential = paymentPart.type === _sdk.Core.CredentialType.KeyHash ? {
    VerificationKey: [paymentPart.hash]
  } : {
    Script: [paymentPart.hash]
  };
  var stakeCredential = undefined;
  if (props.delegationPart) {
    var stakeCred = props.delegationPart.type === _sdk.Core.CredentialType.KeyHash ? {
      VerificationKey: [props.delegationPart.hash]
    } : {
      Script: [props.delegationPart.hash]
    };
    stakeCredential = {
      Inline: [stakeCred]
    };
  }
  return {
    address: {
      payment_credential: paymentCredential,
      stake_credential: stakeCredential
    },
    datum: datum
  };
}

/**
 * Derives a RealFi owner from the exact cancellation authority Sundae V3
 * assigns to an owner address. Sundae prefers a base address's staking hash
 * over its payment hash, while deciding Signature vs Script from the address's
 * payment credential, so this must use Sundae's builder rather than reimplement
 * those semantics from the Blaze address parts.
 */
function realfiOwnerFromSundaeV3OwnerAddress(network, ownerAddress) {
  var sundaeOwner = new _core2.DatumBuilderV3(network).buildOwnerDatum(ownerAddress).schema;
  if ("Signature" in sundaeOwner) {
    return {
      Signature: {
        key_hash: sundaeOwner.Signature.keyHash
      }
    };
  }
  if ("Script" in sundaeOwner) {
    return {
      Script: {
        script_hash: sundaeOwner.Script.scriptHash
      }
    };
  }
  throw new Error("Unsupported Sundae V3 owner datum derived from address");
}

/**
 * Reconstructs a Cardano address from a generated RealFi destination address.
 */
function realfiDestinationToAddress(network, destination) {
  var paymentCred = destination.address.payment_credential;
  var stakingCred = destination.address.stake_credential;
  var paymentCredCore = "VerificationKey" in paymentCred ? keyCredential(paymentCred.VerificationKey[0]) : scriptCredential(paymentCred.Script[0]);
  var stakingCredCore = undefined;
  if (stakingCred && "Inline" in stakingCred) {
    var inlineCredential = stakingCred.Inline[0];
    stakingCredCore = "VerificationKey" in inlineCredential ? keyCredential(inlineCredential.VerificationKey[0]) : scriptCredential(inlineCredential.Script[0]);
  }
  return _sdk.Core.addressFromCredentials(network, paymentCredCore, stakingCredCore);
}

/**
 * Converts a step result's optional inline datum into the Sundae V3 destination
 * datum shape.
 */
function sundaeV3DestinationDatumFromStepResult(stepResult) {
  return stepResult.datum ? {
    type: _core2.EDatumType.INLINE,
    value: stepResult.datum.toCbor().toString()
  } : {
    type: _core2.EDatumType.NONE
  };
}

/**
 * Builds the Sundae V3 destination address payload for a step result.
 */
function sundaeV3DestinationAddressFromStepResult(stepResult) {
  return {
    address: stepResult.address.toBech32(),
    datum: sundaeV3DestinationDatumFromStepResult(stepResult)
  };
}

/**
 * Serializes the Sundae V3 destination used by classic, stableswap, and
 * linearswap orders to route proceeds to the next step.
 */
function sundaeV3DestinationFromStepResult(network, stepResult) {
  return new _core2.DatumBuilderV3(network).buildDestinationAddresses(sundaeV3DestinationAddressFromStepResult(stepResult));
}

/**
 * Returns the step result's inline datum for protocols that store continuation
 * data directly as an optional Plutus datum.
 */
function inlineDatumFromStepResult(stepResult) {
  return stepResult.datum;
}

/**
 * Parses Plutus data from a CBOR hex string.
 */
function plutusDataFromCbor(cborHex) {
  return _core.PlutusData.fromCbor((0, _core.HexBlob)(cborHex));
}
function keyCredential(hash) {
  return _sdk.Core.Credential.fromCore({
    type: _sdk.Core.CredentialType.KeyHash,
    hash: (0, _core.Hash28ByteBase16)(hash)
  });
}
function scriptCredential(hash) {
  return _sdk.Core.Credential.fromCore({
    type: _sdk.Core.CredentialType.ScriptHash,
    hash: (0, _core.Hash28ByteBase16)(hash)
  });
}
//# sourceMappingURL=destination.js.map