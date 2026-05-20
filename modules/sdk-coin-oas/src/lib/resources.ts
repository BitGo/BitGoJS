import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'oas testnet',
    networkId: (coins.get('toas').network as EthereumNetwork).chainId,
    chainId: (coins.get('toas').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
    hardfork: 'london',
    eips: [1559],
  }
);

export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'oas mainnet',
    networkId: (coins.get('oas').network as EthereumNetwork).chainId,
    chainId: (coins.get('oas').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'mainnet',
    hardfork: 'london',
    eips: [1559],
  }
);
