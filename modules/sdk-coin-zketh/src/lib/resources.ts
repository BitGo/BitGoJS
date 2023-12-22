import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'zkSync sepolia',
    networkId: (coins.get('tzketh').network as EthereumNetwork).chainId,
    chainId: (coins.get('tzketh').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
  }
);

export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'zkSync',
    networkId: (coins.get('zketh').network as EthereumNetwork).chainId,
    chainId: (coins.get('zketh').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'mainnet',
  }
);
