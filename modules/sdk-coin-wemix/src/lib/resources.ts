import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'wemix testnet',
    networkId: (coins.get('twemix').network as EthereumNetwork).chainId,
    chainId: (coins.get('twemix').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
    hardfork: 'london',
    eips: [1559],
  }
);

export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'wemix mainnet',
    networkId: (coins.get('wemix').network as EthereumNetwork).chainId,
    chainId: (coins.get('wemix').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'mainnet',
    hardfork: 'london',
    eips: [1559],
  }
);
