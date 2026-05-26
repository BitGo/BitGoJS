/**
 * Core interface for pluggable WASM coin adapters.
 *
 * Design goals:
 *   - Narrow: three primitives only — address derivation, transaction parsing,
 *     transaction building. Explain logic, verification policy, token naming,
 *     and product-facing semantics stay in BitGoJS coin modules.
 *   - No account-lib dependency: adapters implement this interface directly
 *     against BaseCoin, not against inherited account-lib shapes.
 *   - Per-coin raw payloads: each adapter can carry chain-specific results
 *     under the `raw` field without forcing them into a shared schema.
 */

// =============================================================================
// Capability flags
// =============================================================================

export type WasmCoinCapability = 'deriveAddress' | 'parseTransaction' | 'buildTransaction';

// =============================================================================
// Shared normalized result types
// =============================================================================

/**
 * Normalized address derivation result.
 *
 * `address` is always the canonical on-chain representation.
 * `raw` holds chain-specific output (workchain ID, public key, etc.).
 */
export interface WasmDerivedAddress {
  address: string;
  /** Optional memo/tag/destination ID used by some account-model chains. */
  memoId?: string;
  raw?: unknown;
}

/**
 * Normalized transaction parse result.
 *
 * Inputs and outputs use string amounts to avoid bigint serialization edge
 * cases across module boundaries. The adapter converts at this boundary.
 * `raw` holds the chain-native parsed object for callers that need it.
 */
export interface WasmParsedTransaction {
  /** Chain transaction ID (hash/signature), undefined for unsigned transactions. */
  id?: string;
  inputs?: Array<{ address: string; amount: string }>;
  outputs?: Array<{ address: string; amount: string }>;
  raw: unknown;
}

/**
 * Normalized transaction build result.
 *
 * `serialized` is always the canonical wire encoding for broadcast.
 * `encoding` describes how to interpret `serialized`.
 * `raw` holds the chain-native transaction object if the caller needs it.
 */
export interface WasmBuiltTransaction {
  serialized: Uint8Array | string;
  encoding: 'hex' | 'base64' | 'bytes';
  raw?: unknown;
}

// =============================================================================
// Adapter interface
// =============================================================================

/**
 * Per-coin WASM adapter contract.
 *
 * Each WASM package (wasm-solana, wasm-dot, wasm-ton, ...) registers a thin
 * adapter that satisfies this interface. The adapter translates between the
 * abstract normalized types above and the concrete WASM package API.
 *
 * Type parameters allow adapters to type their inputs precisely while still
 * conforming to the shared contract via structural subtyping.
 */
export interface WasmCoinAdapter<
  TAddressParams = unknown,
  TAddressResult extends WasmDerivedAddress = WasmDerivedAddress,
  TParseParams = unknown,
  TParseResult extends WasmParsedTransaction = WasmParsedTransaction,
  TBuildParams = unknown,
  TBuildResult extends WasmBuiltTransaction = WasmBuiltTransaction,
> {
  /** Canonical coin identifier, e.g. "sol", "dot", "ton". */
  readonly coin: string;
  /** Subset of capabilities this adapter actually implements. */
  readonly capabilities: ReadonlySet<WasmCoinCapability>;

  deriveAddress?(params: TAddressParams): TAddressResult | Promise<TAddressResult>;
  parseTransaction?(params: TParseParams): TParseResult | Promise<TParseResult>;
  buildTransaction?(params: TBuildParams): TBuildResult | Promise<TBuildResult>;
}
