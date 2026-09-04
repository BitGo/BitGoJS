import { address, fixedScriptWallet } from '@bitgo/wasm-utxo';

import { isZcashCoin, UtxoCoinName } from '../names';

const ScriptRecipientPrefix = 'scriptPubKey:';

/**
 * Check if the address is a script recipient (starts with `scriptPubKey:`).
 * @param address
 */
export function isScriptRecipient(address: string): boolean {
  return address.toLowerCase().startsWith(ScriptRecipientPrefix.toLowerCase());
}

/**
 * An extended address is one that encodes either a regular address or a hex encoded script with the prefix `scriptPubKey:`.
 * This function converts the extended address format to either a script or an address.
 * @param extendedAddress
 */
export function fromExtendedAddressFormat(extendedAddress: string): { address: string } | { script: string } {
  if (isScriptRecipient(extendedAddress)) {
    return { script: extendedAddress.slice(ScriptRecipientPrefix.length) };
  }
  return { address: extendedAddress };
}

export function fromExtendedAddressFormatToScript(
  extendedAddress: string,
  coinName: UtxoCoinName,
  resolveScript?: (address: string, coinName: UtxoCoinName) => Uint8Array
): Buffer {
  const result = fromExtendedAddressFormat(extendedAddress);
  if ('script' in result) {
    return Buffer.from(result.script, 'hex');
  }
  const script = resolveScript
    ? resolveScript(result.address, coinName)
    : address.toOutputScriptWithCoin(result.address, coinName);
  return Buffer.from(script);
}

export function toOutputScript(
  v: string | { address: string } | { script: string },
  coinName: UtxoCoinName,
  resolveScript?: (address: string, coinName: UtxoCoinName) => Uint8Array
): Buffer {
  if (typeof v === 'string') {
    return fromExtendedAddressFormatToScript(v, coinName, resolveScript);
  }
  if ('script' in v) {
    return Buffer.from(v.script, 'hex');
  }
  if ('address' in v) {
    return fromExtendedAddressFormatToScript(v.address, coinName, resolveScript);
  }
  throw new Error('invalid input');
}

const OP_RETURN = 0x6a;

/**
 * Encode raw Orchard/Ironwood shielded-receiver bytes as a single-receiver ZIP-316 Unified
 * Address, or return `undefined` when the bytes are not a valid receiver — `encodeOrchardReceiver`
 * throws for anything that is not one, so the try/catch doubles as the receiver-validity check.
 */
function encodeShieldedReceiver(script: Buffer, coinName: 'zec' | 'tzec'): string | undefined {
  try {
    return fixedScriptWallet.ZcashUnifiedAddress.encodeOrchardReceiver(new Uint8Array(script), coinName);
  } catch {
    return undefined;
  }
}

/**
 * Zcash extended-address format: a script is either a raw Orchard/Ironwood shielded receiver —
 * which is not a scriptPubKey at all and can only be represented as a Unified Address — or an
 * ordinary transparent scriptPubKey.
 */
function zcashToExtendedAddressFormat(script: Buffer, coinName: 'zec' | 'tzec'): string {
  return encodeShieldedReceiver(script, coinName) ?? address.fromOutputScriptWithCoin(script, coinName);
}

/**
 * Convert a script or address to the extended address format.
 * @param script
 * @param coinName
 * @returns if the script is an OP_RETURN script, then it will be prefixed with `scriptPubKey:`; if
 * it is a Zcash shielded receiver (a raw Orchard/Ironwood receiver, which is not a scriptPubKey at
 * all), it will be encoded as a single-receiver ZIP-316 Unified Address; otherwise it will be
 * converted to an address.
 */
export function toExtendedAddressFormat(script: Buffer, coinName: UtxoCoinName): string {
  if (script[0] === OP_RETURN) {
    return `${ScriptRecipientPrefix}${script.toString('hex')}`;
  }
  if (isZcashCoin(coinName)) {
    return zcashToExtendedAddressFormat(script, coinName);
  }
  return address.fromOutputScriptWithCoin(script, coinName);
}

export function assertValidTransactionRecipient(output: { amount: bigint | number | string; address?: string }): void {
  // In the case that this is an OP_RETURN output or another non-encodable scriptPubkey, we dont have an address.
  // We will verify that the amount is zero, and if it isnt then we will throw an error.
  if (!output.address || isScriptRecipient(output.address)) {
    if (output.amount.toString() !== '0') {
      throw new Error(
        `Only zero amounts allowed for non-encodeable scriptPubkeys: amount: ${output.amount}, address: ${output.address}`
      );
    }
  }
}
