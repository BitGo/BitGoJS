"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPsbtInputFields = void 0;
const getScriptType_1 = require("./getScriptType");
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
const getPsbtInputFields = (utxo, publicKeyNoCoord) => {
    const scriptPubKey = Buffer.from(utxo.scriptPubKey, "hex");
    const type = (0, getScriptType_1.getScriptType)(scriptPubKey);
    switch (type) {
        case getScriptType_1.BitcoinScriptType.P2PKH: {
            if (!utxo.rawTxHex) {
                throw new Error("Missing rawTxHex for legacy P2PKH input");
            }
            return { nonWitnessUtxo: Buffer.from(utxo.rawTxHex, "hex") };
        }
        case getScriptType_1.BitcoinScriptType.P2SH: {
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
        case getScriptType_1.BitcoinScriptType.P2WPKH: {
            return {
                witnessUtxo: {
                    script: scriptPubKey,
                    value: utxo.value,
                },
            };
        }
        case getScriptType_1.BitcoinScriptType.P2WSH: {
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
        case getScriptType_1.BitcoinScriptType.P2TR: {
            return Object.assign({ witnessUtxo: {
                    script: scriptPubKey,
                    value: utxo.value,
                } }, (publicKeyNoCoord && { tapInternalKey: publicKeyNoCoord }));
        }
        default:
            throw new Error(`Unsupported script type: ${type}`);
    }
};
exports.getPsbtInputFields = getPsbtInputFields;
