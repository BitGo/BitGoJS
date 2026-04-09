import { address } from '@bitgo/wasm-utxo';

import { UtxoCoinName } from '../names';

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

export function fromExtendedAddressFormatToScript(extendedAddress: string, coinName: UtxoCoinName): Buffer {
  const result = fromExtendedAddressFormat(extendedAddress);
  if ('script' in result) {
    return Buffer.from(result.script, 'hex');
  }
  return Buffer.from(address.toOutputScriptWithCoin(result.address, coinName));
}

export function toOutputScript(v: string | { address: string } | { script: string }, coinName: UtxoCoinName): Buffer {
  if (typeof v === 'string') {
    return fromExtendedAddressFormatToScript(v, coinName);
  }
  if ('script' in v) {
    return Buffer.from(v.script, 'hex');
  }
  if ('address' in v) {
    return fromExtendedAddressFormatToScript(v.address, coinName);
  }
  throw new Error('invalid input');
}

const OP_RETURN = 0x6a;

/**
 * Convert a script or address to the extended address format.
 * @param script
 * @param coinName
 * @returns if the script is an OP_RETURN script, then it will be prefixed with `scriptPubKey:`, otherwise it will be converted to an address.
 */
export function toExtendedAddressFormat(script: Buffer, coinName: UtxoCoinName): string {
  return script[0] === OP_RETURN
    ? `${ScriptRecipientPrefix}${script.toString('hex')}`
    : address.fromOutputScriptWithCoin(script, coinName);
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
