import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'mon testnet',
    networkId: (coins.get('tmon').network as EthereumNetwork).chainId,
    chainId: (coins.get('tmon').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
    hardfork: 'london',
    eips: [1559],
  }
);
export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'Mon mainnet',
  },
  {
    baseChain: 'mainnet',
    hardfork: 'london',
    eips: [1559],
  }
);
