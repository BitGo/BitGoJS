"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidBabylonAddress = void 0;
const encoding_1 = require("@cosmjs/encoding");
/**
 * Validates a Babylon address. Babylon addresses are encoded in Bech32 format
 * and have a prefix of "bbn".
 * @param address - The address to validate.
 * @returns True if the address is valid, false otherwise.
 */
const isValidBabylonAddress = (address) => {
    try {
        const { prefix } = (0, encoding_1.fromBech32)(address);
        return prefix === "bbn";
    }
    catch (error) {
        return false;
    }
};
exports.isValidBabylonAddress = isValidBabylonAddress;
