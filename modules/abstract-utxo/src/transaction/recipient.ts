import { address as wasmAddress } from '@bitgo/wasm-utxo';

import { toWasmUtxoCoinName, UtxoCoinName, WasmUtxoCoinName } from '../names';

const ScriptRecipientPrefix = 'scriptPubKey:';
const OP_RETURN = 0x6a;

export interface AddressCodecOutput {
  address?: string | null;
  script: Uint8Array;
}

/** Address/network-aware recipient conversion. */
export class AddressCodec {
  constructor(
    public readonly coinName: UtxoCoinName,
    public readonly wasmName: WasmUtxoCoinName = toWasmUtxoCoinName(coinName)
  ) {}

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
    return wasmAddress.toOutputScriptWithCoin(address, this.wasmName);
  }

  /**
   * Resolve a change address to its script. Change addresses are always transparent wallet
   * addresses, so coins whose address resolution depends on transaction context (e.g. Zcash
   * Unified Addresses with a bound recipient preference) override this to bypass that
   * context. The base implementation defers to decode.
   */
  decodeChangeAddress(address: string): Uint8Array {
    return this.decode(address);
  }

  /** Resolve a transparent change address directly to a Buffer script. */
  decodeChangeScript(address: string): Buffer {
    return Buffer.from(this.decodeChangeAddress(address));
  }

  /**
   * Convert an output's scriptPubKey back to the address form the output should report. The
   * base implementation encodes the script. Coins whose output scripts cannot always be
   * re-encoded (e.g. Zcash shielded recipients, whose raw Orchard receiver has no scriptPubKey
   * encoding) override this and may fall back to the output's original address.
   */
  outputScriptToAddress(script: Buffer, address?: string): string {
    return this.toExtendedAddressFormat(script);
  }

  encode(script: Uint8Array): string {
    return wasmAddress.fromOutputScriptWithCoin(script, this.wasmName);
  }

  isValidAddress(address: string): boolean {
    try {
      return this.encode(this.decode(address)) === address;
    } catch {
      return false;
    }
  }

  fromExtendedAddressFormatToScript(extendedAddress: string): Buffer {
    const result = AddressCodec.fromExtendedAddressFormat(extendedAddress);
    if ('script' in result) {
      return Buffer.from(result.script, 'hex');
    }
    return Buffer.from(this.decode(result.address));
  }

  isMatchingScript(output: AddressCodecOutput): boolean {
    if (output.address === undefined || output.address === null) {
      return true;
    }

    try {
      return this.fromExtendedAddressFormatToScript(output.address).equals(Buffer.from(output.script));
    } catch {
      return false;
    }
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
    return script[0] === OP_RETURN ? `${ScriptRecipientPrefix}${script.toString('hex')}` : this.encode(script);
  }
}

/** Legacy helper retained for consumers that use the module-level recipient API. */
export function isScriptRecipient(address: string): boolean {
  return AddressCodec.isScriptRecipient(address);
}

/** Legacy helper retained for consumers that use the module-level recipient API. */
export function fromExtendedAddressFormat(extendedAddress: string): { address: string } | { script: string } {
  return AddressCodec.fromExtendedAddressFormat(extendedAddress);
}

/** Legacy helper retained for consumers that use the module-level recipient API. */
export function fromExtendedAddressFormatToScript(extendedAddress: string, coinName: UtxoCoinName): Buffer {
  return new AddressCodec(coinName).fromExtendedAddressFormatToScript(extendedAddress);
}

/** Legacy helper retained for consumers that use the module-level recipient API. */
export function toOutputScript(v: string | { address: string } | { script: string }, coinName: UtxoCoinName): Buffer {
  return new AddressCodec(coinName).toOutputScript(v);
}

/** Legacy helper retained for consumers that use the module-level recipient API. */
export function toExtendedAddressFormat(script: Buffer, coinName: UtxoCoinName): string {
  return new AddressCodec(coinName).toExtendedAddressFormat(script);
}

/** Legacy helper retained for consumers that use the module-level recipient API. */
export function assertValidTransactionRecipient(output: { amount: bigint | number | string; address?: string }): void {
  AddressCodec.assertValidTransactionRecipient(output);
}
