import { CoinFeature } from '@bitgo/statics';

import { IBaseCoin } from '../../baseCoin';
import { SignableTransaction } from './baseTypes';

export interface CoinWithSerializedTxHexVerification {
  /**
   * Returns true when this specific unsigned transaction must be verified from
   * `serializedTxHex` instead of `signableHex` (for example, a legacy type-0
   * EVM EIP-155 signing preimage on an EIP-1559 chain).
   *
   * Implementations MAY throw when the signable envelope is recognized but
   * unsupported (for example a pre-EIP-155 legacy preimage), so callers must let
   * that error propagate before signing.
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
 *
 * The coin-specific check runs whenever the coin implements it, including for
 * coins whose feature already forces the serialized route, so an unsupported
 * envelope (e.g. a pre-EIP-155 legacy preimage) is rejected instead of being
 * silently verified. Errors thrown by the coin check propagate to the caller.
 */
export function shouldVerifyWithSerializedTxHex(coin: IBaseCoin, unsignedTx?: SignableTransaction): boolean {
  const featureForcesSerializedRoute = coin
    .getConfig()
    .features?.includes(CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX);
  if (unsignedTx && isCoinWithSerializedTxHexVerification(coin)) {
    const coinDetectedSerializedRoute = coin.shouldVerifyWithSerializedTxHex(unsignedTx);
    return Boolean(featureForcesSerializedRoute) || coinDetectedSerializedRoute;
  }
  return Boolean(featureForcesSerializedRoute);
}
