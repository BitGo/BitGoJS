"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inputValueSum = exports.getEstimatedChangeOutputSize = exports.getInputSizeByScript = exports.isOP_RETURN = void 0;
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const fee_1 = require("../../constants/fee");
// Helper function to check if a script is OP_RETURN
const isOP_RETURN = (script) => {
    const decompiled = bitcoinjs_lib_1.script.decompile(script);
    return !!decompiled && decompiled[0] === bitcoinjs_lib_1.opcodes.OP_RETURN;
};
exports.isOP_RETURN = isOP_RETURN;
/**
 * Determines the size of a transaction input based on its script type.
 *
 * @param script - The script of the input.
 * @returns The estimated size of the input in bytes.
 */
const getInputSizeByScript = (script) => {
    // Check if input is in the format of "00 <20-byte public key hash>"
    // If yes, it is a P2WPKH input
    try {
        const { address: p2wpkhAddress } = bitcoinjs_lib_1.payments.p2wpkh({
            output: script,
        });
        if (p2wpkhAddress) {
            return fee_1.P2WPKH_INPUT_SIZE;
        }
        // eslint-disable-next-line no-empty
    }
    catch (error) { } // Ignore errors
    // Check if input is in the format of "51 <32-byte public key>"
    // If yes, it is a P2TR input
    try {
        const { address: p2trAddress } = bitcoinjs_lib_1.payments.p2tr({
            output: script,
        });
        if (p2trAddress) {
            return fee_1.P2TR_INPUT_SIZE;
        }
        // eslint-disable-next-line no-empty
    }
    catch (error) { } // Ignore errors
    // Otherwise, assume the input is largest P2PKH address type
    return fee_1.DEFAULT_INPUT_SIZE;
};
exports.getInputSizeByScript = getInputSizeByScript;
/**
 * Returns the estimated size for a change output.
 * This is used when the transaction has a change output to a particular address.
 *
 * @returns The estimated size for a change output in bytes.
 */
const getEstimatedChangeOutputSize = () => {
    return fee_1.MAX_NON_LEGACY_OUTPUT_SIZE;
};
exports.getEstimatedChangeOutputSize = getEstimatedChangeOutputSize;
/**
 * Returns the sum of the values of the UTXOs.
 *
 * @param inputUTXOs - The UTXOs to sum the values of.
 * @returns The sum of the values of the UTXOs in satoshis.
 */
const inputValueSum = (inputUTXOs) => {
    return inputUTXOs.reduce((acc, utxo) => acc + utxo.value, 0);
};
exports.inputValueSum = inputValueSum;
