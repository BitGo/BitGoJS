import { fromBech32 } from "@cosmjs/encoding";

/**
 * Validates a Babylon address. Babylon addresses are encoded in Bech32 format
 * and have a prefix of "bbn".
 * @param address - The address to validate.
 * @returns True if the address is valid, false otherwise.
 */
export const isValidBabylonAddress = (address: string): boolean => {
  try {
    const { prefix } = fromBech32(address);
    return prefix === "bbn";
  } catch (error) {
    return false;
  }
};
