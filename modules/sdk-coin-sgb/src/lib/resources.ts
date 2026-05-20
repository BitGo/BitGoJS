import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'sgb testnet',
    networkId: (coins.get('tsgb').network as EthereumNetwork).chainId,
    chainId: (coins.get('tsgb').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
    hardfork: 'london',
    eips: [1559],
  }
);

export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'sgb mainnet',
    networkId: (coins.get('sgb').network as EthereumNetwork).chainId,
    chainId: (coins.get('sgb').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'mainnet',
    hardfork: 'london',
    eips: [1559],
  }
);
