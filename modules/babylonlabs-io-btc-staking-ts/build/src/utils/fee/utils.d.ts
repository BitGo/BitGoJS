import { UTXO } from "../../types/UTXO";
export declare const isOP_RETURN: (script: Buffer) => boolean;
/**
 * Determines the size of a transaction input based on its script type.
 *
 * @param script - The script of the input.
 * @returns The estimated size of the input in bytes.
 */
export declare const getInputSizeByScript: (script: Buffer) => number;
/**
 * Returns the estimated size for a change output.
 * This is used when the transaction has a change output to a particular address.
 *
 * @returns The estimated size for a change output in bytes.
 */
export declare const getEstimatedChangeOutputSize: () => number;
/**
 * Returns the sum of the values of the UTXOs.
 *
 * @param inputUTXOs - The UTXOs to sum the values of.
 * @returns The sum of the values of the UTXOs in satoshis.
 */
export declare const inputValueSum: (inputUTXOs: UTXO[]) => number;
