import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'tapechain testnet',
    networkId: (coins.get('tapechain').network as EthereumNetwork).chainId,
    chainId: (coins.get('tapechain').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
    hardfork: 'london',
    eips: [1559],
  }
);

export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'ApeChain',
    networkId: (coins.get('apechain').network as EthereumNetwork).chainId,
    chainId: (coins.get('apechain').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'mainnet',
    hardfork: 'london',
    eips: [1559],
  }
);
