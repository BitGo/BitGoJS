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

  const commonConfig: any = {
    baseChain: coin.network.type === NetworkType.MAINNET ? 'mainnet' : 'sepolia',
  };

  if (coin.features.includes(CoinFeature.EIP1559)) {
    commonConfig.hardfork = 'london';
    commonConfig.eips = [1559];
  }

  return EthereumCommon.custom(
    {
      name: coin.network.name,
      networkId: (coin.network as EthereumNetwork).chainId,
      chainId: (coin.network as EthereumNetwork).chainId,
    },
    commonConfig
  );
}
