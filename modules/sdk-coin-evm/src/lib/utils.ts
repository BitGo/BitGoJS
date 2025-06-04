import { CoinFeature, NetworkType, BaseCoin, EthereumNetwork } from '@bitgo/statics';
import EthereumCommon from '@ethereumjs/common';
import { InvalidTransactionError } from '@bitgo/sdk-core';

/**
 * @param {NetworkType} network either mainnet or testnet
 * @returns {EthereumCommon} Ethereum common configuration object
 */
export function getCommon(coin: Readonly<BaseCoin>): EthereumCommon {
  if (!coin.features.includes(CoinFeature.SHARED_EVM_SDK)) {
    throw new InvalidTransactionError(`Cannot use common sdk module for the coin ${coin.name}`);
  }

  if (!coin.features.includes(CoinFeature.SHARED_EVM_SDK)) {
    throw new InvalidTransactionError(`Cannot use common sdk module for the coin ${coin.name}`);
  }
  return EthereumCommon.custom(
    {
      name: coin.network.name,
      networkId: (coin.network as EthereumNetwork).chainId,
      chainId: (coin.network as EthereumNetwork).chainId,
    },
    {
      baseChain: coin.network.type === NetworkType.MAINNET ? 'mainnet' : 'sepolia',
      hardfork: coin.features.includes(CoinFeature.EIP1559) ? 'london' : undefined,
      eips: coin.features.includes(CoinFeature.EIP1559) ? [1559] : undefined,
    }
  );
}
