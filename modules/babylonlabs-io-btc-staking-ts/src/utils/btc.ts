import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";
import { initEccLib, address, networks } from "bitcoinjs-lib";
import { NO_COORD_PK_BYTE_LENGTH } from "../constants/keys";

// Initialize elliptic curve library
export const initBTCCurve = () => {
  initEccLib(ecc);
}

/**
 * Check whether the given address is a valid Bitcoin address.
 *
 * @param {string} btcAddress - The Bitcoin address to check.
 * @param {object} network - The Bitcoin network (e.g., bitcoin.networks.bitcoin).
 * @returns {boolean} - True if the address is valid, otherwise false.
 */
export const isValidBitcoinAddress = (
  btcAddress: string,
  network: networks.Network,
): boolean => {
  try {
    return !!address.toOutputScript(btcAddress, network);
  } catch (error) {
    return false;
  }
};

/**
 * Check whether the given address is a Taproot address.
 *
 * @param {string} taprootAddress - The Bitcoin bech32 encoded address to check.
 * @param {object} network - The Bitcoin network (e.g., bitcoin.networks.bitcoin).
 * @returns {boolean} - True if the address is a Taproot address, otherwise false.
 */
export const isTaproot = (taprootAddress: string, network: networks.Network): boolean => {
  try {
    const decoded = address.fromBech32(taprootAddress);
    if (decoded.version !== 1) {
      return false;
    }
    switch (network) {
      case networks.bitcoin:
        // Check if address statrts with "bc1p"
        return taprootAddress.startsWith("bc1p");
      case networks.testnet:
        // signet, regtest and testnet taproot addresses start with "tb1p" or "sb1p"
        return taprootAddress.startsWith("tb1p") || taprootAddress.startsWith("sb1p");
      default:
        return false;
    }  
  } catch (error) {
    return false;
  }
};

/**
 * Check whether the given public key is a valid public key without a coordinate.
 *
 * @param {string} pkWithNoCoord - public key without the coordinate.  
 * @returns {boolean} - True if the public key without the coordinate is valid, otherwise false.
 */
export const isValidNoCoordPublicKey = (pkWithNoCoord: string): boolean => {
  try {
    const keyBuffer = Buffer.from(pkWithNoCoord, 'hex');
    return validateNoCoordPublicKeyBuffer(keyBuffer);
  } catch (error) {
    return false;
  }
}

/**
 * Get the public key without the coordinate.
 * 
 * @param {string} pkHex - The public key in hex, with or without the coordinate.
 * @returns {string} - The public key without the coordinate in hex.
 * @throws {Error} - If the public key is invalid.
 */
export const getPublicKeyNoCoord = (pkHex: string): String => {
  const publicKey = Buffer.from(pkHex, "hex");

  const publicKeyNoCoordBuffer =
    publicKey.length === NO_COORD_PK_BYTE_LENGTH
      ? publicKey
      : publicKey.subarray(1, 33);

  // Validate the public key without coordinate
  if (!validateNoCoordPublicKeyBuffer(publicKeyNoCoordBuffer)) {
    throw new Error("Invalid public key without coordinate");
  }

  return publicKeyNoCoordBuffer.toString("hex");
};

const validateNoCoordPublicKeyBuffer = (pkBuffer: Buffer): boolean => {
  if (pkBuffer.length !== NO_COORD_PK_BYTE_LENGTH) {
    return false;
  }

  // Try both compressed forms: y-coordinate even (0x02) and y-coordinate odd (0x03)
  const compressedKeyEven = Buffer.concat([Buffer.from([0x02]), pkBuffer]);
  const compressedKeyOdd = Buffer.concat([Buffer.from([0x03]), pkBuffer]);

  return (
    ecc.isPoint(compressedKeyEven) || ecc.isPoint(compressedKeyOdd)
  );
};

/**
 * Convert a transaction id to a hash. in buffer format.
 * 
 * @param {string} txId - The transaction id.
 * @returns {Buffer} - The transaction hash.
 */
export const transactionIdToHash = (txId: string): Buffer => {
  if (txId === "") {
    throw new Error("Transaction id cannot be empty");
  }
  return Buffer.from(txId, 'hex').reverse();
};
