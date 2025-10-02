import { PsbtInputExtended } from "bip174/src/lib/interfaces";
import { UTXO } from "../../types";
/**
 * Determines and constructs the correct PSBT input fields for a given UTXO based on its script type.
 * This function handles different Bitcoin script types (P2PKH, P2SH, P2WPKH, P2WSH, P2TR) and returns
 * the appropriate PSBT input fields required for that UTXO.
 *
 * @param {UTXO} utxo - The unspent transaction output to process
 * @param {Buffer} [publicKeyNoCoord] - The public of the staker (optional).
 * @returns {object} PSBT input fields object containing the necessary data
 * @throws {Error} If required input data is missing or if an unsupported script type is provided
 */
export declare const getPsbtInputFields: (utxo: UTXO, publicKeyNoCoord?: Buffer) => PsbtInputExtended;
