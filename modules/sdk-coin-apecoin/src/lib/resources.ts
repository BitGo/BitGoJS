import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'tapecoin testnet',
    networkId: (coins.get('tapecoin').network as EthereumNetwork).chainId,
    chainId: (coins.get('tapecoin').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
    hardfork: 'london',
    eips: [1559],
  }
);

export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'apecoin mainnet',
    networkId: (coins.get('apecoin').network as EthereumNetwork).chainId,
    chainId: (coins.get('apecoin').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'mainnet',
    hardfork: 'london',
    eips: [1559],
  }
);
