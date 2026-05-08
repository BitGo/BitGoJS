import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'coredao testnet',
    networkId: (coins.get('tcoredao').network as EthereumNetwork).chainId,
    chainId: (coins.get('tcoredao').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
    hardfork: 'london',
    eips: [1559],
  }
);

export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'coredao mainnet',
    networkId: (coins.get('coredao').network as EthereumNetwork).chainId,
    chainId: (coins.get('coredao').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'mainnet',
    hardfork: 'london',
    eips: [1559],
  }
);
