import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo-beta/statics';

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
