/**
 * WASM-based TON transaction explanation.
 *
 * Built on @bitgo/wasm-ton's parseTransaction(). Derives transaction types,
 * extracts outputs/inputs, and maps to BitGoJS TransactionExplanation format.
 * This is BitGo-specific business logic that lives outside the wasm package.
 */

import type { ParsedTransaction as WasmParsedTransaction } from '@bitgo/wasm-ton';
import { TransactionExplanation } from './iface';
import { SINGLE_NOMINATOR_WITHDRAW_ALL_COMMENT } from './constants';

/**
 * @bitgo/wasm-ton is loaded lazily (not via a static top-level import) so this
 * module doesn't drag the eagerly-registered `Ton`/`Tton` coin classes into
 * the same async-WASM-initialization chain in bundlers, which breaks
 * synchronous coin registration in the browser.
 *
 * This uses `require()`, not dynamic `import()`: Node's `import()` always
 * resolves the package's "import" condition (the ESM build), and that build
 * loads its .wasm binary via a raw ESM import, which throws
 * ERR_UNKNOWN_FILE_EXTENSION on Node 20 without an experimental flag. The CJS
 * build (resolved by `require()`) instantiates the same .wasm file
 * synchronously via `fs.readFileSync`, which works on every supported Node
 * version. In the browser, webpack's `@bitgo/sdk-coin-ton`/`@bitgo/wasm-ton`
 * aliases rewrite the resolved path regardless of require/import syntax, so
 * this still routes to the ESM build there.
 */
async function loadWasmTon() {
  return require('@bitgo/wasm-ton') as typeof import('@bitgo/wasm-ton');
}

export interface ExplainTonTransactionWasmOptions {
  txBase64: string;
  /** When false, use the original bounce-flag-respecting address format. Defaults to true (bounceable EQ...). */
  toAddressBounceable?: boolean;
}

function extractOutputs(
  parsed: WasmParsedTransaction,
  toAddressBounceable: boolean
): {
  outputs: { address: string; amount: string; memo?: string }[];
  outputAmount: string;
  withdrawAmount: string | undefined;
} {
  const outputs: { address: string; amount: string; memo?: string }[] = [];
  let withdrawAmount: string | undefined;

  for (const action of parsed.sendActions) {
    if (action.jettonTransfer) {
      outputs.push({
        address: action.jettonTransfer.destination,
        amount: String(action.jettonTransfer.amount),
        // the jetton forward comment — the memo exchanges use to credit token deposits
        ...(action.memo !== undefined && action.memo !== '' ? { memo: action.memo } : {}),
      });
    } else {
      // destinationBounceable is always EQ... (bounceable)
      // destination respects the original bounce flag (UQ... when bounce=false)
      // The comment is exposed as memo only for plain sends, mirroring the TonWeb
      // parser: op-0 comments that are whales/single-nominator protocol text
      // classify the transaction as a staking type, not a user memo.
      const memo =
        action.memo !== undefined &&
        action.memo !== '' &&
        action.memo !== 'Deposit' &&
        action.memo !== 'Withdraw' &&
        action.memo !== SINGLE_NOMINATOR_WITHDRAW_ALL_COMMENT
          ? action.memo
          : undefined;
      outputs.push({
        address: toAddressBounceable ? action.destinationBounceable : action.destination,
        amount: String(action.amount),
        ...(memo !== undefined ? { memo } : {}),
      });
    }

    // withdrawAmount comes from the body payload parsed by WASM (not the message TON value)
    if (action.withdrawAmount !== undefined) {
      withdrawAmount = String(action.withdrawAmount);
    }
  }

  const outputAmount = outputs.reduce((sum, o) => sum + BigInt(o.amount), 0n);

  return { outputs, outputAmount: String(outputAmount), withdrawAmount };
}

/**
 * Standalone WASM-based transaction explanation for TON.
 *
 * Parses the transaction via `parseTransaction(tx)` from @bitgo/wasm-ton,
 * then derives the transaction type, extracts outputs/inputs, and maps
 * to BitGoJS TransactionExplanation format.
 */
export async function explainTonTransaction(params: ExplainTonTransactionWasmOptions): Promise<TransactionExplanation> {
  const { Transaction: WasmTonTransaction, parseTransaction } = await loadWasmTon();
  const toAddressBounceable = params.toAddressBounceable !== false;
  const tx = WasmTonTransaction.fromBytes(Buffer.from(params.txBase64, 'base64'));
  const parsed: WasmParsedTransaction = parseTransaction(tx);

  const { outputs, outputAmount, withdrawAmount } = extractOutputs(parsed, toAddressBounceable);

  return {
    displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'withdrawAmount'],
    id: tx.id,
    outputs,
    outputAmount,
    changeOutputs: [],
    changeAmount: '0',
    fee: { fee: 'UNKNOWN' },
    withdrawAmount,
  };
}

/**
 * Get the signable payload (SHA-256 hash of the sign body cell) for a serialized TON transaction.
 *
 * Isolated behind this module (rather than imported directly in ton.ts) so the
 * eagerly-registered `Ton`/`Tton` coin classes don't carry @bitgo/wasm-ton's
 * async WASM initialization into their own module's top-level import graph.
 */
export async function getSignablePayloadWasm(serializedTx: string): Promise<Buffer> {
  const { Transaction: WasmTonTransaction } = await loadWasmTon();
  const tx = WasmTonTransaction.fromBytes(Buffer.from(serializedTx, 'base64'));
  return Buffer.from(tx.signablePayload());
}

/**
 * Convert an already memoId-stripped TON address to its bounceable (EQ...) form.
 *
 * See {@link getSignablePayloadWasm} for why this lives here rather than in ton.ts.
 */
export async function toBounceableAddressWasm(strippedAddress: string): Promise<string> {
  const { decode: wasmDecode, encode: wasmEncode } = await loadWasmTon();
  const decoded = wasmDecode(strippedAddress);
  return wasmEncode(decoded.workchainId, decoded.addressHash, true);
}
