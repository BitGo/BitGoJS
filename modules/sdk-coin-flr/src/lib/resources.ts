import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'flr testnet',
    networkId: (coins.get('tflr').network as EthereumNetwork).chainId,
    chainId: (coins.get('tflr').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'coston',
    hardfork: 'london',
    eips: [1559],
  }
);

export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'flr mainnet',
    networkId: (coins.get('flr').network as EthereumNetwork).chainId,
    chainId: (coins.get('flr').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'mainnet',
    hardfork: 'london',
    eips: [1559],
  }
);
