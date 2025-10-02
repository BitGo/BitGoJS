/**
 * Supported Bitcoin script types
 */
export declare enum BitcoinScriptType {
    P2PKH = "pubkeyhash",
    P2SH = "scripthash",
    P2WPKH = "witnesspubkeyhash",
    P2WSH = "witnessscripthash",
    P2TR = "taproot"
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
export declare const getScriptType: (script: Buffer) => BitcoinScriptType;
