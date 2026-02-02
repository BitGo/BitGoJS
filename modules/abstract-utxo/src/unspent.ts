import { fixedScriptWallet } from '@bitgo/wasm-utxo';

/**
 * Unspent transaction output (UTXO) type definition
 *
 * This type represents an unspent transaction output, independent from utxo-lib.
 * The structure matches utxolib.bitgo.Unspent but is defined locally.
 *
 * @property id - Format: ${txid}:${vout}. Use `parseOutputId(id)` to parse.
 * @property address - The network-specific encoded address. Use `toOutputScript(address, network)` to obtain scriptPubKey.
 * @property value - The amount in satoshi.
 */
export interface Unspent<TNumber extends number | bigint = number> {
  /**
   * Format: ${txid}:${vout}.
   * Use `parseOutputId(id)` to parse.
   */
  id: string;
  /**
   * The network-specific encoded address.
   * Use `toOutputScript(address, network)` to obtain scriptPubKey.
   */
  address: string;
  /**
   * The amount in satoshi.
   */
  value: TNumber;
}

/**
 * Wallet unspent type - extends Unspent with wallet-specific fields
 *
 * This type includes all fields from Unspent plus:
 * - chain: ChainCode (chain code for wallet derivation)
 * - index: number (index for wallet derivation)
 */
export interface WalletUnspent<TNumber extends number | bigint = number> extends Unspent<TNumber> {
  chain: fixedScriptWallet.ChainCode;
  index: number;
}

/**
 * Unspent with previous transaction data
 *
 * Extends Unspent with:
 * - prevTx: Buffer (previous transaction data for legacy transactions)
 */
export interface UnspentWithPrevTx<TNumber extends number | bigint = number> extends Unspent<TNumber> {
  prevTx: Buffer;
}
