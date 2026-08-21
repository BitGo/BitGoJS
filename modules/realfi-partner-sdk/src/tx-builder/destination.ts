/* eslint-disable @typescript-eslint/naming-convention */

import { Hash28ByteBase16, HexBlob, PlutusData } from "@blaze-cardano/core";
import { Core } from "@blaze-cardano/sdk";
import {
  DatumBuilderV3,
  EDatumType,
  type TDatum,
  type TDatumResult,
  type TDestinationAddress,
  type TSupportedNetworks,
} from "@sundaeswap/core";

import type {
  Destination,
  MultisigScript,
} from "../generated-types/v1_0/index.js";

/**
 * Intermediate output produced by one flow step and consumed by the previous
 * flow step as its continuation destination.
 */
export interface TxBuilderStepResult {
  address: Core.Address;
  datum?: PlutusData;
}

export type RealFiDestinationDatum = Destination["datum"];
export type SundaeV3DestinationResult = TDatumResult<
  ReturnType<DatumBuilderV3["buildDestinationAddresses"]>["schema"]
>;

/**
 * Converts a step result's optional inline datum into the RealFi destination
 * datum shape.
 */
export function realfiDestinationDatumFromStepResult(
  stepResult: TxBuilderStepResult,
): RealFiDestinationDatum {
  return stepResult.datum ? { InlineDatum: [stepResult.datum] } : "NoDatum";
}

/**
 * Builds a RealFi destination that points to a step result's address and datum.
 */
export function realfiDestinationFromStepResult(
  stepResult: TxBuilderStepResult,
): Destination {
  return addressToRealFiDestination(
    stepResult.address,
    realfiDestinationDatumFromStepResult(stepResult),
  );
}

/**
 * Converts a Cardano address plus optional datum into the generated RealFi
 * destination type.
 */
export function addressToRealFiDestination(
  address: Core.Address,
  datum: RealFiDestinationDatum = "NoDatum",
): Destination {
  const props = address.getProps();
  const paymentPart = props.paymentPart;

  if (!paymentPart) {
    throw new Error("Address must have a payment part");
  }

  const paymentCredential =
    paymentPart.type === Core.CredentialType.KeyHash
      ? { VerificationKey: [paymentPart.hash] as [string] }
      : { Script: [paymentPart.hash] as [string] };

  let stakeCredential: Destination["address"]["stake_credential"] = undefined;
  if (props.delegationPart) {
    const stakeCred =
      props.delegationPart.type === Core.CredentialType.KeyHash
        ? { VerificationKey: [props.delegationPart.hash] as [string] }
        : { Script: [props.delegationPart.hash] as [string] };
    stakeCredential = { Inline: [stakeCred] };
  }

  return {
    address: {
      payment_credential: paymentCredential,
      stake_credential: stakeCredential,
    },
    datum,
  };
}

/**
 * Derives a RealFi owner from the exact cancellation authority Sundae V3
 * assigns to an owner address. Sundae prefers a base address's staking hash
 * over its payment hash, while deciding Signature vs Script from the address's
 * payment credential, so this must use Sundae's builder rather than reimplement
 * those semantics from the Blaze address parts.
 */
export function realfiOwnerFromSundaeV3OwnerAddress(
  network: TSupportedNetworks,
  ownerAddress: string,
): MultisigScript {
  const sundaeOwner = new DatumBuilderV3(network).buildOwnerDatum(
    ownerAddress,
  ).schema;

  if ("Signature" in sundaeOwner) {
    return { Signature: { key_hash: sundaeOwner.Signature.keyHash } };
  }
  if ("Script" in sundaeOwner) {
    return { Script: { script_hash: sundaeOwner.Script.scriptHash } };
  }

  throw new Error("Unsupported Sundae V3 owner datum derived from address");
}

/**
 * Reconstructs a Cardano address from a generated RealFi destination address.
 */
export function realfiDestinationToAddress(
  network: Core.NetworkId,
  destination: Destination,
): Core.Address {
  const paymentCred = destination.address.payment_credential;
  const stakingCred = destination.address.stake_credential;

  const paymentCredCore =
    "VerificationKey" in paymentCred
      ? keyCredential(paymentCred.VerificationKey[0])
      : scriptCredential(paymentCred.Script[0]);

  let stakingCredCore: Core.Credential | undefined = undefined;
  if (stakingCred && "Inline" in stakingCred) {
    const inlineCredential = stakingCred.Inline[0];
    stakingCredCore =
      "VerificationKey" in inlineCredential
        ? keyCredential(inlineCredential.VerificationKey[0])
        : scriptCredential(inlineCredential.Script[0]);
  }

  return Core.addressFromCredentials(network, paymentCredCore, stakingCredCore);
}

/**
 * Converts a step result's optional inline datum into the Sundae V3 destination
 * datum shape.
 */
export function sundaeV3DestinationDatumFromStepResult(
  stepResult: TxBuilderStepResult,
): TDatum {
  return stepResult.datum
    ? {
        type: EDatumType.INLINE,
        value: stepResult.datum.toCbor().toString(),
      }
    : { type: EDatumType.NONE };
}

/**
 * Builds the Sundae V3 destination address payload for a step result.
 */
export function sundaeV3DestinationAddressFromStepResult(
  stepResult: TxBuilderStepResult,
): TDestinationAddress {
  return {
    address: stepResult.address.toBech32(),
    datum: sundaeV3DestinationDatumFromStepResult(stepResult),
  };
}

/**
 * Serializes the Sundae V3 destination used by classic, stableswap, and
 * linearswap orders to route proceeds to the next step.
 */
export function sundaeV3DestinationFromStepResult(
  network: TSupportedNetworks,
  stepResult: TxBuilderStepResult,
): SundaeV3DestinationResult {
  return new DatumBuilderV3(network).buildDestinationAddresses(
    sundaeV3DestinationAddressFromStepResult(stepResult),
  );
}

/**
 * Returns the step result's inline datum for protocols that store continuation
 * data directly as an optional Plutus datum.
 */
export function inlineDatumFromStepResult(
  stepResult: TxBuilderStepResult,
): PlutusData | undefined {
  return stepResult.datum;
}

/**
 * Parses Plutus data from a CBOR hex string.
 */
export function plutusDataFromCbor(cborHex: string): PlutusData {
  return PlutusData.fromCbor(HexBlob(cborHex));
}

function keyCredential(hash: string): Core.Credential {
  return Core.Credential.fromCore({
    type: Core.CredentialType.KeyHash,
    hash: Hash28ByteBase16(hash),
  });
}

function scriptCredential(hash: string): Core.Credential {
  return Core.Credential.fromCore({
    type: Core.CredentialType.ScriptHash,
    hash: Hash28ByteBase16(hash),
  });
}
