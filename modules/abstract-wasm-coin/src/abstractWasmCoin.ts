import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import type {
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  VerifyTransactionOptions,
  VerifyAddressOptions,
  TssVerifyAddressOptions,
} from '@bitgo/sdk-core';
import type { WasmCoinAdapter } from './types';

/**
 * Abstract base class for WASM-backed coins in BitGoJS.
 *
 * Extends BaseCoin (IBaseCoin) so that WASM coins fit naturally into the
 * BitGoJS coin registry and platform infrastructure — no account-lib shims.
 *
 * The constructor takes a WasmCoinAdapter that supplies the three chain-native
 * primitives: address derivation, transaction parsing, and transaction building.
 * Everything else (explain logic, verification policy, product semantics) is
 * implemented by the concrete subclass, exactly as in abstract-eth or abstract-cosmos.
 *
 * Concrete coin classes (e.g. WasmSol, WasmDot, WasmTon) extend this class and:
 *   - implement the remaining abstract methods (getChain, getFamily, getFullName,
 *     getBaseFactor, generateKeyPair, isValidPub, isValidAddress, signTransaction,
 *     verifyTransaction, isWalletAddress)
 *   - pass the appropriate WasmCoinAdapter to super()
 */
export abstract class AbstractWasmCoin extends BaseCoin {
  protected readonly wasmAdapter: WasmCoinAdapter;

  protected constructor(bitgo: BitGoBase, adapter: WasmCoinAdapter) {
    super(bitgo);
    this.wasmAdapter = adapter;
  }

  // ---------------------------------------------------------------------------
  // WASM-backed primitive: parseTransaction
  //
  // Delegates to the adapter for raw chain-native decoding.
  // Explain logic remains in the concrete coin module.
  // ---------------------------------------------------------------------------

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    if (!this.wasmAdapter.parseTransaction) {
      throw new Error(`${this.wasmAdapter.coin}: parseTransaction is not supported by the WASM adapter`);
    }
    const result = await Promise.resolve(this.wasmAdapter.parseTransaction(params as never));
    return result as unknown as ParsedTransaction;
  }

  // ---------------------------------------------------------------------------
  // WASM-backed primitive: getSignablePayload
  //
  // Concrete coins override this when the WASM adapter provides a
  // signable-payload extractor (e.g. wasm-ton's tx.signablePayload()).
  // ---------------------------------------------------------------------------

  async getSignablePayload(serializedTx: string): Promise<Buffer> {
    return Buffer.from(serializedTx);
  }

  // ---------------------------------------------------------------------------
  // Mandatory abstract methods inherited from BaseCoin.
  // Declared abstract here so concrete coin subclasses are forced to implement them.
  // ---------------------------------------------------------------------------

  abstract getChain(): string;
  abstract getFamily(): string;
  abstract getFullName(): string;
  abstract getBaseFactor(): number | string;

  abstract generateKeyPair(seed?: Buffer): KeyPair;
  abstract isValidPub(pub: string): boolean;
  abstract isValidAddress(address: string): boolean;

  abstract signTransaction(params: SignTransactionOptions): Promise<SignedTransaction>;
  abstract verifyTransaction(params: VerifyTransactionOptions): Promise<boolean>;
  abstract isWalletAddress(params: VerifyAddressOptions | TssVerifyAddressOptions): Promise<boolean>;
}
