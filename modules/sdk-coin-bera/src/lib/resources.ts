import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'Berachain bArtio',
    networkId: (coins.get('tbera').network as EthereumNetwork).chainId,
    chainId: (coins.get('tbera').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'bArtio',
    hardfork: 'london',
    eips: [1559],
  }
);

export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'bera mainnet',
    networkId: (coins.get('bera').network as EthereumNetwork).chainId,
    chainId: (coins.get('bera').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'mainnet',
    hardfork: 'london',
    eips: [1559],
  }
);
