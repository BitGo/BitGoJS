import { script as bitcoinScript, opcodes, payments } from "bitcoinjs-lib";
import {
  DEFAULT_INPUT_SIZE,
  MAX_NON_LEGACY_OUTPUT_SIZE,
  P2TR_INPUT_SIZE,
  P2WPKH_INPUT_SIZE,
} from "../../constants/fee";
import { UTXO } from "../../types/UTXO";

// Helper function to check if a script is OP_RETURN
export const isOP_RETURN = (script: Buffer): boolean => {
  const decompiled = bitcoinScript.decompile(script);
  return !!decompiled && decompiled[0] === opcodes.OP_RETURN;
};

/**
 * Determines the size of a transaction input based on its script type.
 *
 * @param script - The script of the input.
 * @returns The estimated size of the input in bytes.
 */
export const getInputSizeByScript = (script: Buffer): number => {
  // Check if input is in the format of "00 <20-byte public key hash>"
  // If yes, it is a P2WPKH input
  try {
    const { address: p2wpkhAddress } = payments.p2wpkh({
      output: script,
    });
    if (p2wpkhAddress) {
      return P2WPKH_INPUT_SIZE;
    }
    // eslint-disable-next-line no-empty
  } catch (error) {} // Ignore errors
  // Check if input is in the format of "51 <32-byte public key>"
  // If yes, it is a P2TR input
  try {
    const { address: p2trAddress } = payments.p2tr({
      output: script,
    });
    if (p2trAddress) {
      return P2TR_INPUT_SIZE;
    }
    // eslint-disable-next-line no-empty
  } catch (error) {} // Ignore errors
  // Otherwise, assume the input is largest P2PKH address type
  return DEFAULT_INPUT_SIZE;
};

/**
 * Returns the estimated size for a change output.
 * This is used when the transaction has a change output to a particular address.
 *
 * @returns The estimated size for a change output in bytes.
 */
export const getEstimatedChangeOutputSize = (): number => {
  return MAX_NON_LEGACY_OUTPUT_SIZE;
};

/**
 * Returns the sum of the values of the UTXOs.
 *
 * @param inputUTXOs - The UTXOs to sum the values of.
 * @returns The sum of the values of the UTXOs in satoshis.
 */
export const inputValueSum = (inputUTXOs: UTXO[]): number => {
  return inputUTXOs.reduce((acc, utxo) => acc + utxo.value, 0);
};
