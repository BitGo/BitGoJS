import { CoinFeature } from '@bitgo/statics';

import { IBaseCoin } from '../../baseCoin';

/**
 * Returns true when TSS verifyTransaction should decode serializedTxHex instead of
 * signableHex (e.g. ICP hash digests, or legacy EIP-155 RLP that fails ethereumjs
 * fromSerializedTx). Controlled via CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX.
 */
export function shouldVerifyWithSerializedTxHex(coin: IBaseCoin): boolean {
  return coin.getConfig().features?.includes(CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX) ?? false;
}
