import { CoinFeature } from '@bitgo/statics';

import { IBaseCoin } from '../../baseCoin';
import { SignableTransaction } from './baseTypes';

export interface CoinWithSerializedTxHexVerification {
  /**
   * Returns true when this specific unsigned transaction must be verified from
   * `serializedTxHex` instead of `signableHex` (for example, a legacy type-0
   * EVM EIP-155 signing preimage on an EIP-1559 chain).
   */
  shouldVerifyWithSerializedTxHex(unsignedTx: SignableTransaction): boolean;
}

export function isCoinWithSerializedTxHexVerification(coin: unknown): coin is CoinWithSerializedTxHexVerification {
  return (
    coin !== null &&
    typeof coin === 'object' &&
    typeof (coin as CoinWithSerializedTxHexVerification).shouldVerifyWithSerializedTxHex === 'function'
  );
}

/**
 * Returns true when TSS verifyTransaction should decode serializedTxHex instead of
 * signableHex:
 * - CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX (ICP hash digests, BSC/XDC legacy
 *   EIP-155 RLP, etc.)
 * - Coin-specific envelope detection when `unsignedTx` is provided (e.g. a legacy
 *   type-0 EVM transaction on an EIP-1559 chain whose signableHex is an EIP-155
 *   signing preimage rather than a parseable serialized transaction).
 */
export function shouldVerifyWithSerializedTxHex(coin: IBaseCoin, unsignedTx?: SignableTransaction): boolean {
  if (coin.getConfig().features?.includes(CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX)) {
    return true;
  }
  if (unsignedTx && isCoinWithSerializedTxHexVerification(coin)) {
    return coin.shouldVerifyWithSerializedTxHex(unsignedTx);
  }
  return false;
}
