import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'xdc testnet',
    networkId: (coins.get('txdc').network as EthereumNetwork).chainId,
    chainId: (coins.get('txdc').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
  }
);

export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'xdc mainnet',
    networkId: (coins.get('xdc').network as EthereumNetwork).chainId,
    chainId: (coins.get('xdc').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'mainnet',
  }
);
