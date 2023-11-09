import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'arbitrum sepolia',
    networkId: (coins.get('tarbeth').network as EthereumNetwork).chainId,
    chainId: (coins.get('tarbeth').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
    hardfork: 'london',
  }
);

export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'arbitrum one',
    networkId: (coins.get('arbeth').network as EthereumNetwork).chainId,
    chainId: (coins.get('arbeth').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'mainnet',
    hardfork: 'london',
  }
);
