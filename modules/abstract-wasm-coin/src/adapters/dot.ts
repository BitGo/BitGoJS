/**
 * Polkadot WASM adapter for abstract-wasm-coin.
 *
 * Wraps @bitgo/wasm-dot and exposes:
 *   - parseTransaction  — decodes a hex-encoded extrinsic into normalized outputs/inputs
 *
 * Explain logic (type derivation, staking destination sentinel, batch pattern
 * detection, proxy deposit cost) stays in sdk-coin-dot/wasmParser.ts.
 * This adapter is a thin translation layer only.
 */
import { DotTransaction, parseTransaction } from '@bitgo/wasm-dot';
import type { Material } from '@bitgo/wasm-dot';
import type { WasmCoinAdapter, WasmCoinCapability, WasmParsedTransaction } from '../types';

// =============================================================================
// Adapter-specific param/result types
// =============================================================================

export interface DotParseParams {
  /** Hex-encoded extrinsic bytes. */
  txHex: string;
  /** Runtime material (genesisHash, specVersion, metadata, etc.) required for parsing. */
  material: Material;
  senderAddress?: string;
}

export interface DotParsedTransaction extends WasmParsedTransaction {
  raw: ReturnType<typeof parseTransaction>;
}

// =============================================================================
// Adapter implementation
// =============================================================================

export const dotAdapter: WasmCoinAdapter<never, never, DotParseParams, DotParsedTransaction> = {
  coin: 'dot',
  capabilities: new Set<WasmCoinCapability>(['parseTransaction']),

  parseTransaction(params: DotParseParams): DotParsedTransaction {
    const tx = DotTransaction.fromHex(params.txHex, params.material);
    const context = {
      material: params.material,
      sender: params.senderAddress,
    };
    const parsed = parseTransaction(tx, context);

    // Extract the most basic output: dest + value from a transfer, if present.
    // Explain policy (staking, batch, proxy) stays in sdk-coin-dot.
    const outputs: Array<{ address: string; amount: string }> = [];
    const inputs: Array<{ address: string; amount: string }> = [];

    const args = (parsed.method.args ?? {}) as Record<string, unknown>;
    const key = `${parsed.method.pallet}.${parsed.method.name}`;
    if (
      key === 'balances.transfer' ||
      key === 'balances.transferKeepAlive' ||
      key === 'balances.transferAllowDeath'
    ) {
      const dest = String(args.dest ?? '');
      const value = String(args.value ?? '0');
      if (dest) {
        outputs.push({ address: dest, amount: value });
        if (params.senderAddress) {
          inputs.push({ address: params.senderAddress, amount: value });
        }
      }
    }

    return {
      id: parsed.id ?? undefined,
      inputs,
      outputs,
      raw: parsed,
    };
  },
};
