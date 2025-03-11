"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionIdToHash = exports.getPublicKeyNoCoord = exports.isValidNoCoordPublicKey = exports.isTaproot = exports.isValidBitcoinAddress = exports.initBTCCurve = void 0;
const ecc = __importStar(require("@bitcoin-js/tiny-secp256k1-asmjs"));
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const keys_1 = require("../constants/keys");
// Initialize elliptic curve library
const initBTCCurve = () => {
    (0, bitcoinjs_lib_1.initEccLib)(ecc);
};
exports.initBTCCurve = initBTCCurve;
/**
 * Check whether the given address is a valid Bitcoin address.
 *
 * @param {string} btcAddress - The Bitcoin address to check.
 * @param {object} network - The Bitcoin network (e.g., bitcoin.networks.bitcoin).
 * @returns {boolean} - True if the address is valid, otherwise false.
 */
const isValidBitcoinAddress = (btcAddress, network) => {
    try {
        return !!bitcoinjs_lib_1.address.toOutputScript(btcAddress, network);
    }
    catch (error) {
        return false;
    }
};
exports.isValidBitcoinAddress = isValidBitcoinAddress;
/**
 * Check whether the given address is a Taproot address.
 *
 * @param {string} taprootAddress - The Bitcoin bech32 encoded address to check.
 * @param {object} network - The Bitcoin network (e.g., bitcoin.networks.bitcoin).
 * @returns {boolean} - True if the address is a Taproot address, otherwise false.
 */
const isTaproot = (taprootAddress, network) => {
    try {
        const decoded = bitcoinjs_lib_1.address.fromBech32(taprootAddress);
        if (decoded.version !== 1) {
            return false;
        }
        switch (network) {
            case bitcoinjs_lib_1.networks.bitcoin:
                // Check if address statrts with "bc1p"
                return taprootAddress.startsWith("bc1p");
            case bitcoinjs_lib_1.networks.testnet:
                // signet, regtest and testnet taproot addresses start with "tb1p" or "sb1p"
                return taprootAddress.startsWith("tb1p") || taprootAddress.startsWith("sb1p");
            default:
                return false;
        }
    }
    catch (error) {
        return false;
    }
};
exports.isTaproot = isTaproot;
/**
 * Check whether the given public key is a valid public key without a coordinate.
 *
 * @param {string} pkWithNoCoord - public key without the coordinate.
 * @returns {boolean} - True if the public key without the coordinate is valid, otherwise false.
 */
const isValidNoCoordPublicKey = (pkWithNoCoord) => {
    try {
        const keyBuffer = Buffer.from(pkWithNoCoord, 'hex');
        return validateNoCoordPublicKeyBuffer(keyBuffer);
    }
    catch (error) {
        return false;
    }
};
exports.isValidNoCoordPublicKey = isValidNoCoordPublicKey;
/**
 * Get the public key without the coordinate.
 *
 * @param {string} pkHex - The public key in hex, with or without the coordinate.
 * @returns {string} - The public key without the coordinate in hex.
 * @throws {Error} - If the public key is invalid.
 */
const getPublicKeyNoCoord = (pkHex) => {
    const publicKey = Buffer.from(pkHex, "hex");
    const publicKeyNoCoordBuffer = publicKey.length === keys_1.NO_COORD_PK_BYTE_LENGTH
        ? publicKey
        : publicKey.subarray(1, 33);
    // Validate the public key without coordinate
    if (!validateNoCoordPublicKeyBuffer(publicKeyNoCoordBuffer)) {
        throw new Error("Invalid public key without coordinate");
    }
    return publicKeyNoCoordBuffer.toString("hex");
};
exports.getPublicKeyNoCoord = getPublicKeyNoCoord;
const validateNoCoordPublicKeyBuffer = (pkBuffer) => {
    if (pkBuffer.length !== keys_1.NO_COORD_PK_BYTE_LENGTH) {
        return false;
    }
    // Try both compressed forms: y-coordinate even (0x02) and y-coordinate odd (0x03)
    const compressedKeyEven = Buffer.concat([Buffer.from([0x02]), pkBuffer]);
    const compressedKeyOdd = Buffer.concat([Buffer.from([0x03]), pkBuffer]);
    return (ecc.isPoint(compressedKeyEven) || ecc.isPoint(compressedKeyOdd));
};
/**
 * Convert a transaction id to a hash. in buffer format.
 *
 * @param {string} txId - The transaction id.
 * @returns {Buffer} - The transaction hash.
 */
const transactionIdToHash = (txId) => {
    if (txId === "") {
        throw new Error("Transaction id cannot be empty");
    }
    return Buffer.from(txId, 'hex').reverse();
};
exports.transactionIdToHash = transactionIdToHash;
