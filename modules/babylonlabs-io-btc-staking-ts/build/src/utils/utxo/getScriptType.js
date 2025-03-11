"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScriptType = exports.BitcoinScriptType = void 0;
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
/**
 * Supported Bitcoin script types
 */
var BitcoinScriptType;
(function (BitcoinScriptType) {
    // Pay to Public Key Hash
    BitcoinScriptType["P2PKH"] = "pubkeyhash";
    // Pay to Script Hash
    BitcoinScriptType["P2SH"] = "scripthash";
    // Pay to Witness Public Key Hash
    BitcoinScriptType["P2WPKH"] = "witnesspubkeyhash";
    // Pay to Witness Script Hash
    BitcoinScriptType["P2WSH"] = "witnessscripthash";
    // Pay to Taproot
    BitcoinScriptType["P2TR"] = "taproot";
})(BitcoinScriptType || (exports.BitcoinScriptType = BitcoinScriptType = {}));
/**
 * Determines the type of Bitcoin script.
 *
 * This function tries to parse the script using different Bitcoin payment types and returns
 * a string identifier for the script type.
 *
 * @param script - The raw script as a Buffer
 * @returns {BitcoinScriptType} The identified script type
 * @throws {Error} If the script cannot be identified as any known type
 */
const getScriptType = (script) => {
    try {
        bitcoinjs_lib_1.payments.p2pkh({ output: script });
        return BitcoinScriptType.P2PKH;
    }
    catch (_a) { }
    try {
        bitcoinjs_lib_1.payments.p2sh({ output: script });
        return BitcoinScriptType.P2SH;
    }
    catch (_b) { }
    try {
        bitcoinjs_lib_1.payments.p2wpkh({ output: script });
        return BitcoinScriptType.P2WPKH;
    }
    catch (_c) { }
    try {
        bitcoinjs_lib_1.payments.p2wsh({ output: script });
        return BitcoinScriptType.P2WSH;
    }
    catch (_d) { }
    try {
        bitcoinjs_lib_1.payments.p2tr({ output: script });
        return BitcoinScriptType.P2TR;
    }
    catch (_e) { }
    throw new Error("Unknown script type");
};
exports.getScriptType = getScriptType;
