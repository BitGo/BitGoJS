import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'optimistim sepolia',
    networkId: (coins.get('topeth').network as EthereumNetwork).chainId,
    chainId: (coins.get('topeth').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
  }
);

export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'optimism',
    networkId: (coins.get('opeth').network as EthereumNetwork).chainId,
    chainId: (coins.get('opeth').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'mainnet',
  }
);
