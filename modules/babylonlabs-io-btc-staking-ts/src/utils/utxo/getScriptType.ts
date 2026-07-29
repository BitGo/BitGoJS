import { payments } from "bitcoinjs-lib";

/**
 * Supported Bitcoin script types
 */
export enum BitcoinScriptType {
  // Pay to Public Key Hash
  P2PKH = "pubkeyhash",
  // Pay to Script Hash
  P2SH = "scripthash",
  // Pay to Witness Public Key Hash
  P2WPKH = "witnesspubkeyhash",
  // Pay to Witness Script Hash
  P2WSH = "witnessscripthash",
  // Pay to Taproot
  P2TR = "taproot",
}

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

export const getScriptType = (script: Buffer): BitcoinScriptType => {
  try {
    payments.p2pkh({ output: script });
    return BitcoinScriptType.P2PKH;
  } catch {}
  try {
    payments.p2sh({ output: script });
    return BitcoinScriptType.P2SH;
  } catch {}
  try {
    payments.p2wpkh({ output: script });
    return BitcoinScriptType.P2WPKH;
  } catch {}
  try {
    payments.p2wsh({ output: script });
    return BitcoinScriptType.P2WSH;
  } catch {}
  try {
    payments.p2tr({ output: script });
    return BitcoinScriptType.P2TR;
  } catch {}

  throw new Error("Unknown script type");
};
