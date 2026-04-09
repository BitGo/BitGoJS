import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'world testnet',
    networkId: (coins.get('tworld').network as EthereumNetwork).chainId,
    chainId: (coins.get('tworld').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
    hardfork: 'london',
    eips: [1559],
  }
);
export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'World mainnet',
    networkId: (coins.get('world').network as EthereumNetwork).chainId,
    chainId: (coins.get('world').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'mainnet',
    hardfork: 'london',
    eips: [1559],
  }
);
