import { address as wasmAddress } from '@bitgo/wasm-utxo';

import { UtxoCoinName } from '../names';

const ScriptRecipientPrefix = 'scriptPubKey:';
const OP_RETURN = 0x6a;

export type UnifiedRecipientPreference = 'transparent' | 'shielded';

/** Address/network-aware recipient conversion with overridable address decoding. */
export class AddressCodec {
  constructor(public readonly coinName: UtxoCoinName) {}

  /** Check if the address is a script recipient (starts with `scriptPubKey:`). */
  static isScriptRecipient(address: string): boolean {
    return address.toLowerCase().startsWith(ScriptRecipientPrefix.toLowerCase());
  }

  /** Convert an extended address to either a regular address or a raw script. */
  static fromExtendedAddressFormat(extendedAddress: string): { address: string } | { script: string } {
    if (AddressCodec.isScriptRecipient(extendedAddress)) {
      return { script: extendedAddress.slice(ScriptRecipientPrefix.length) };
    }
    return { address: extendedAddress };
  }

  static assertValidTransactionRecipient(output: { amount: bigint | number | string; address?: string }): void {
    // In the case that this is an OP_RETURN output or another non-encodable scriptPubkey, we dont have an address.
    // We will verify that the amount is zero, and if it isnt then we will throw an error.
    if (!output.address || AddressCodec.isScriptRecipient(output.address)) {
      if (output.amount.toString() !== '0') {
        throw new Error(
          `Only zero amounts allowed for non-encodeable scriptPubkeys: amount: ${output.amount}, address: ${output.address}`
        );
      }
    }
  }

  decode(address: string): Uint8Array {
    return wasmAddress.toOutputScriptWithCoin(address, this.coinName);
  }

  fromExtendedAddressFormatToScript(extendedAddress: string): Buffer {
    const result = AddressCodec.fromExtendedAddressFormat(extendedAddress);
    if ('script' in result) {
      return Buffer.from(result.script, 'hex');
    }
    return Buffer.from(this.decode(result.address));
  }

  toOutputScript(v: string | { address: string } | { script: string }): Buffer {
    if (typeof v === 'string') {
      return this.fromExtendedAddressFormatToScript(v);
    }
    if ('script' in v) {
      return Buffer.from(v.script, 'hex');
    }
    if ('address' in v) {
      return this.fromExtendedAddressFormatToScript(v.address);
    }
    throw new Error('invalid input');
  }

  toExtendedAddressFormat(script: Buffer): string {
    return script[0] === OP_RETURN
      ? `${ScriptRecipientPrefix}${script.toString('hex')}`
      : wasmAddress.fromOutputScriptWithCoin(script, this.coinName);
  }
}
