import { PlutusData } from "@blaze-cardano/core";
import { Core } from "@blaze-cardano/sdk";
import { DatumBuilderV3, type TDatum, type TDatumResult, type TDestinationAddress, type TSupportedNetworks } from "@sundaeswap/core";
import type { Destination, MultisigScript } from "../generated-types/v1_0/index.js";
/**
 * Intermediate output produced by one flow step and consumed by the previous
 * flow step as its continuation destination.
 */
export interface TxBuilderStepResult {
    address: Core.Address;
    datum?: PlutusData;
}
export type RealFiDestinationDatum = Destination["datum"];
export type SundaeV3DestinationResult = TDatumResult<ReturnType<DatumBuilderV3["buildDestinationAddresses"]>["schema"]>;
/**
 * Converts a step result's optional inline datum into the RealFi destination
 * datum shape.
 */
export declare function realfiDestinationDatumFromStepResult(stepResult: TxBuilderStepResult): RealFiDestinationDatum;
/**
 * Builds a RealFi destination that points to a step result's address and datum.
 */
export declare function realfiDestinationFromStepResult(stepResult: TxBuilderStepResult): Destination;
/**
 * Converts a Cardano address plus optional datum into the generated RealFi
 * destination type.
 */
export declare function addressToRealFiDestination(address: Core.Address, datum?: RealFiDestinationDatum): Destination;
/**
 * Derives a RealFi owner from the exact cancellation authority Sundae V3
 * assigns to an owner address. Sundae prefers a base address's staking hash
 * over its payment hash, while deciding Signature vs Script from the address's
 * payment credential, so this must use Sundae's builder rather than reimplement
 * those semantics from the Blaze address parts.
 */
export declare function realfiOwnerFromSundaeV3OwnerAddress(network: TSupportedNetworks, ownerAddress: string): MultisigScript;
/**
 * Reconstructs a Cardano address from a generated RealFi destination address.
 */
export declare function realfiDestinationToAddress(network: Core.NetworkId, destination: Destination): Core.Address;
/**
 * Converts a step result's optional inline datum into the Sundae V3 destination
 * datum shape.
 */
export declare function sundaeV3DestinationDatumFromStepResult(stepResult: TxBuilderStepResult): TDatum;
/**
 * Builds the Sundae V3 destination address payload for a step result.
 */
export declare function sundaeV3DestinationAddressFromStepResult(stepResult: TxBuilderStepResult): TDestinationAddress;
/**
 * Serializes the Sundae V3 destination used by classic, stableswap, and
 * linearswap orders to route proceeds to the next step.
 */
export declare function sundaeV3DestinationFromStepResult(network: TSupportedNetworks, stepResult: TxBuilderStepResult): SundaeV3DestinationResult;
/**
 * Returns the step result's inline datum for protocols that store continuation
 * data directly as an optional Plutus datum.
 */
export declare function inlineDatumFromStepResult(stepResult: TxBuilderStepResult): PlutusData | undefined;
/**
 * Parses Plutus data from a CBOR hex string.
 */
export declare function plutusDataFromCbor(cborHex: string): PlutusData;
//# sourceMappingURL=destination.d.ts.map