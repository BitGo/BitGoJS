/**
 * TON WASM adapter for abstract-wasm-coin.
 *
 * Wraps @bitgo/wasm-ton and exposes:
 *   - deriveAddress     — normalizes a raw TON address to bounceable EQ... form
 *   - parseTransaction  — decodes a base64-encoded TON transaction into normalized outputs/inputs
 *
 * Explain logic, verification policy, and product semantics stay in sdk-coin-ton.
 * This adapter is a thin translation layer only.
 */
import { Transaction as WasmTonTransaction, parseTransaction, decode as wasmDecode, encode as wasmEncode } from '@bitgo/wasm-ton';
import type { WasmCoinAdapter, WasmCoinCapability, WasmDerivedAddress, WasmParsedTransaction } from '../types';

// =============================================================================
// Adapter-specific param/result types
// =============================================================================

export interface TonAddressParams {
  /** Raw address string (any TON format: EQ..., UQ..., workchain:hash hex). */
  address: string;
  /** When true (default), return the bounceable EQ... address. */
  bounceable?: boolean;
}

export interface TonDerivedAddress extends WasmDerivedAddress {
  raw: { workchainId: number; addressHash: Uint8Array };
}

export interface TonParseParams {
  /** Base64-encoded TON transaction bytes. */
  txBase64: string;
  /** When true (default), return bounceable EQ... destination addresses. */
  toAddressBounceable?: boolean;
}

export interface TonParsedTransaction extends WasmParsedTransaction {
  raw: ReturnType<typeof parseTransaction>;
}

// =============================================================================
// Adapter implementation
// =============================================================================

export const tonAdapter: WasmCoinAdapter<TonAddressParams, TonDerivedAddress, TonParseParams, TonParsedTransaction> = {
  coin: 'ton',
  capabilities: new Set<WasmCoinCapability>(['deriveAddress', 'parseTransaction']),

  deriveAddress(params: TonAddressParams): TonDerivedAddress {
    const bounceable = params.bounceable !== false;
    const decoded = wasmDecode(params.address);
    const address = wasmEncode(decoded.workchainId, decoded.addressHash, bounceable);
    return {
      address,
      raw: { workchainId: decoded.workchainId, addressHash: decoded.addressHash },
    };
  },

  parseTransaction(params: TonParseParams): TonParsedTransaction {
    const toAddressBounceable = params.toAddressBounceable !== false;
    const tx = WasmTonTransaction.fromBytes(Buffer.from(params.txBase64, 'base64'));
    const parsed = parseTransaction(tx);

    const outputs: Array<{ address: string; amount: string }> = [];
    const inputs: Array<{ address: string; amount: string }> = [];

    for (const action of parsed.sendActions) {
      const address = toAddressBounceable ? action.destinationBounceable : action.destination;
      const amount = String(action.jettonTransfer ? action.jettonTransfer.amount : action.amount);
      outputs.push({ address, amount });
    }

    // TON is account-model: inputs mirror total output from the sender.
    const totalAmount = outputs.reduce((sum, o) => sum + BigInt(o.amount), 0n);
    if (outputs.length > 0) {
      // Sender address not available from the parsed payload at this layer;
      // callers that need it should use the raw field.
      inputs.push({ address: '', amount: String(totalAmount) });
    }

    return { id: tx.id, inputs, outputs, raw: parsed };
  },
};
