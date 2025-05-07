import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'wld testnet',
    networkId: (coins.get('twld').network as EthereumNetwork).chainId,
    chainId: (coins.get('twld').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
    hardfork: 'london',
    eips: [1559],
  }
);
export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'Wld mainnet',
    networkId: (coins.get('wld').network as EthereumNetwork).chainId,
    chainId: (coins.get('wld').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'mainnet',
    hardfork: 'london',
    eips: [1559],
  }
);
