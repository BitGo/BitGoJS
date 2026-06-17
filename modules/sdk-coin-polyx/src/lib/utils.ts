import { Utils as SubstrateUtils, Interface } from '@bitgo/abstract-substrate';
import { NetworkType } from '@bitgo/statics';
import { TypeRegistry } from '@substrate/txwrapper-core/lib/types';
import { mainnetMaterial, testnetMaterial } from '../resources';
import { BatchCallObject } from './iface';
import { MEMO_HEX_REGEX, MEMO_MAX_BYTES, POLYX_DID_REGEX } from './constants';

export class Utils extends SubstrateUtils {
  /**
   * Get the appropriate address format based on network type
   * Returns 12 for mainnet and 42 for testnet
   *
   * @param coinName The name of the coin
   * @returns The address format to use
   */
  getAddressFormat(coinName: string): number {
    const isMainnet = coinName.toLowerCase() === 'polyx';
    return isMainnet ? 12 : 42;
  }

  /**
   * Checks if a string is a valid Polymesh DID (Decentralized Identifier)
   * DIDs are 32-byte hex strings (0x prefix + 64 hex characters)
   *
   * @param {string} did - The string to validate
   * @returns {boolean} true if valid DID format, false otherwise
   */
  isValidDid(did: string): boolean {
    return POLYX_DID_REGEX.test(did);
  }

  /**
   * Encode a memo string using the NEW Polymesh format:
   * UTF-8 bytes right-padded with 0x00 to 32 bytes, returned as a 0x-prefixed hex string.
   *
   * @param text The intended memo string
   * @returns 0x-prefixed 66-character hex string representing the 32-byte encoded memo
   */
  encodeMemoNew(text: string): string {
    const bytes = Buffer.from(text, 'utf8');
    if (bytes.length > MEMO_MAX_BYTES) {
      throw new Error(`Memo exceeds maximum length of ${MEMO_MAX_BYTES} bytes (got ${bytes.length} bytes)`);
    }
    const textHex = bytes.toString('hex');
    return `0x${textHex.padEnd(64, '0')}`;
  }

  /**
   * Detect whether a decoded 32-byte memo (0x-prefixed hex from txwrapper decode()) uses NEW encoding.
   *
   * Detection rules (see problem.md):
   * - Any 0x00 byte → NEW (null right-padding)
   * - All 0x30 bytes → OLD (memo "0" in ASCII-left-padded form)
   * - Leading 0x30 bytes then non-0x30 content → OLD (ASCII '0' left-padding)
   * - Otherwise → NEW (content at byte 0, full 32-byte memo, or no ASCII pad)
   *
   * @param memo 0x-prefixed 66-char hex string as returned by txwrapper decode()
   */
  isNewMemoEncoding(memo: string): boolean {
    if (!MEMO_HEX_REGEX.test(memo)) return false;

    const bytes = Buffer.from(memo.slice(2), 'hex');

    if (bytes.some((b) => b === 0x00)) return true;
    if (bytes.every((b) => b === 0x30)) return false;

    let leadingAsciiZeros = 0;
    while (leadingAsciiZeros < bytes.length && bytes[leadingAsciiZeros] === 0x30) {
      leadingAsciiZeros++;
    }
    if (leadingAsciiZeros > 0 && leadingAsciiZeros < bytes.length) return false;

    return true;
  }

  getMaterial(networkType: NetworkType): Interface.Material {
    return (networkType === NetworkType.MAINNET ? mainnetMaterial : testnetMaterial) as unknown as Interface.Material;
  }

  decodeMethodName(call: BatchCallObject, registry: TypeRegistry): string {
    // Handle both callIndex and method formats
    const callWithIndex = call as BatchCallObject & { callIndex?: string };
    const methodIdentifier = callWithIndex.callIndex || call.method;

    if (typeof methodIdentifier === 'string') {
      // Check if it looks like a hex callIndex
      if (methodIdentifier.startsWith('0x') && methodIdentifier.length > 2) {
        try {
          const decodedCall = registry.findMetaCall(
            new Uint8Array(Buffer.from(methodIdentifier.replace('0x', ''), 'hex'))
          );
          return decodedCall.method;
        } catch (e) {
          // Fallback: assume it's already the method name
          return methodIdentifier;
        }
      } else {
        // Already a simple method name
        return methodIdentifier;
      }
    }

    // Fallback
    return String(methodIdentifier);
  }
}

const utils = new Utils();
export default utils;
