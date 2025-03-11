/**
 * Validates a Babylon address. Babylon addresses are encoded in Bech32 format
 * and have a prefix of "bbn".
 * @param address - The address to validate.
 * @returns True if the address is valid, false otherwise.
 */
export declare const isValidBabylonAddress: (address: string) => boolean;
