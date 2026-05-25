import { PsbtInputExtended } from "bip174/src/lib/interfaces";

import { UTXO } from "../../types";
import { BitcoinScriptType, getScriptType } from "./getScriptType";

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

export const getPsbtInputFields = (
  utxo: UTXO,
  publicKeyNoCoord?: Buffer,
): PsbtInputExtended => {
  const scriptPubKey = Buffer.from(utxo.scriptPubKey, "hex");
  const type = getScriptType(scriptPubKey);

  switch (type) {
    case BitcoinScriptType.P2PKH: {
      if (!utxo.rawTxHex) {
        throw new Error("Missing rawTxHex for legacy P2PKH input");
      }
      return { nonWitnessUtxo: Buffer.from(utxo.rawTxHex, "hex") };
    }
    case BitcoinScriptType.P2SH: {
      if (!utxo.rawTxHex) {
        throw new Error("Missing rawTxHex for P2SH input");
      }
      if (!utxo.redeemScript) {
        throw new Error("Missing redeemScript for P2SH input");
      }
      return {
        nonWitnessUtxo: Buffer.from(utxo.rawTxHex, "hex"),
        redeemScript: Buffer.from(utxo.redeemScript, "hex"),
      };
    }
    case BitcoinScriptType.P2WPKH: {
      return {
        witnessUtxo: {
          script: scriptPubKey,
          value: utxo.value,
        },
      };
    }
    case BitcoinScriptType.P2WSH: {
      if (!utxo.witnessScript) {
        throw new Error("Missing witnessScript for P2WSH input");
      }
      return {
        witnessUtxo: {
          script: scriptPubKey,
          value: utxo.value,
        },
        witnessScript: Buffer.from(utxo.witnessScript, "hex"),
      };
    }
    case BitcoinScriptType.P2TR: {
      return {
        witnessUtxo: {
          script: scriptPubKey,
          value: utxo.value,
        },
        // this is needed only if the wallet is in taproot mode
        ...(publicKeyNoCoord && { tapInternalKey: publicKeyNoCoord }),
      };
    }
    default:
      throw new Error(`Unsupported script type: ${type}`);
  }
};
