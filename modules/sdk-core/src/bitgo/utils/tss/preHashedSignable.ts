import { IBaseCoin } from '../../baseCoin';
import { SignableTransaction } from './baseTypes';

export interface CoinWithPreHashedSignable {
  /**
   * Returns true when the signableHex for this transaction is already the
   * final signing hash (SHA-256 for Avalanche atomic txs), and the MPC
   * signing flow should use it directly without additional hashing.
   */
  isSignablePreHashed(unsignedTx: SignableTransaction): boolean;
}

export function isCoinWithPreHashedSignable(coin: unknown): coin is CoinWithPreHashedSignable {
  return (
    coin !== null &&
    typeof coin === 'object' &&
    typeof (coin as CoinWithPreHashedSignable).isSignablePreHashed === 'function'
  );
}

/**
 * Detect Avalanche atomic cross-chain transactions by codec prefix.
 *
 * Avalanche codec type IDs start with 0x00000000 (first 4 hex chars = '0000').
 * Standard EVM RLP encoding starts with 0xf8xx — overlap is currently impossible.
 *
 * Note: The WP strips the '0x' prefix from serializedTxHex before storing,
 * so we check for '0000' not '0x0000'.
 */
export function isAvalancheAtomicTx(unsignedTx: SignableTransaction): boolean {
  return unsignedTx.serializedTxHex.startsWith('0000');
}

export function shouldUsePreHashedSignable(coin: IBaseCoin, unsignedTx: SignableTransaction): boolean {
  return isCoinWithPreHashedSignable(coin) && coin.isSignablePreHashed(unsignedTx);
}
