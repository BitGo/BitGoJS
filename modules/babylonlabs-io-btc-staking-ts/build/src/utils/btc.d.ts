import { networks } from "bitcoinjs-lib";
export declare const initBTCCurve: () => void;
/**
 * Check whether the given address is a valid Bitcoin address.
 *
 * @param {string} btcAddress - The Bitcoin address to check.
 * @param {object} network - The Bitcoin network (e.g., bitcoin.networks.bitcoin).
 * @returns {boolean} - True if the address is valid, otherwise false.
 */
export declare const isValidBitcoinAddress: (btcAddress: string, network: networks.Network) => boolean;
/**
 * Check whether the given address is a Taproot address.
 *
 * @param {string} taprootAddress - The Bitcoin bech32 encoded address to check.
 * @param {object} network - The Bitcoin network (e.g., bitcoin.networks.bitcoin).
 * @returns {boolean} - True if the address is a Taproot address, otherwise false.
 */
export declare const isTaproot: (taprootAddress: string, network: networks.Network) => boolean;
/**
 * Check whether the given public key is a valid public key without a coordinate.
 *
 * @param {string} pkWithNoCoord - public key without the coordinate.
 * @returns {boolean} - True if the public key without the coordinate is valid, otherwise false.
 */
export declare const isValidNoCoordPublicKey: (pkWithNoCoord: string) => boolean;
/**
 * Get the public key without the coordinate.
 *
 * @param {string} pkHex - The public key in hex, with or without the coordinate.
 * @returns {string} - The public key without the coordinate in hex.
 * @throws {Error} - If the public key is invalid.
 */
export declare const getPublicKeyNoCoord: (pkHex: string) => String;
/**
 * Convert a transaction id to a hash. in buffer format.
 *
 * @param {string} txId - The transaction id.
 * @returns {Buffer} - The transaction hash.
 */
export declare const transactionIdToHash: (txId: string) => Buffer;
