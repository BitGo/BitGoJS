import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'soneium testnet',
    networkId: (coins.get('tsoneium').network as EthereumNetwork).chainId,
    chainId: (coins.get('tsoneium').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
    hardfork: 'london',
    eips: [1559],
  }
);
export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'Soneium mainnet',
    networkId: (coins.get('soneium').network as EthereumNetwork).chainId,
    chainId: (coins.get('soneium').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'mainnet',
    hardfork: 'london',
    eips: [1559],
  }
);
