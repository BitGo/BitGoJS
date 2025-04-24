import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'stt testnet',
    networkId: (coins.get('tstt').network as EthereumNetwork).chainId,
    chainId: (coins.get('tstt').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
    hardfork: 'london',
    eips: [1559],
  }
);
export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'Somnia mainnet',
    networkId: (coins.get('stt').network as EthereumNetwork).chainId,
    chainId: (coins.get('stt').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'mainnet',
    hardfork: 'london',
    eips: [1559],
  }
);
