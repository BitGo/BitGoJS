import { coins, EthereumNetwork } from '@bitgo/statics';
import EthereumCommon from '@ethereumjs/common';

/**
 * A Common object defining the chain and the hardfork for CELO Testnet
 */
export const testnetCommon = EthereumCommon.custom(
  {
    name: 'celo sepolia testnet',
    networkId: (coins.get('tcelo').network as EthereumNetwork).chainId,
    chainId: (coins.get('tcelo').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
    hardfork: 'london',
    eips: [1559],
  }
);

/**
 * A Common object defining the chain and the hardfork for CELO Mainnet
 */
export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'rc1',
    networkId: (coins.get('celo').network as EthereumNetwork).chainId,
    chainId: (coins.get('celo').network as EthereumNetwork).chainId,
  },
  { hardfork: 'london' }
);
