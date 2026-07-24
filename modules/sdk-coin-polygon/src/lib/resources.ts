import { coins, EthereumNetwork } from '@bitgo/statics';
import EthereumCommon from '@ethereumjs/common';

/**
 * A Common object defining the chain and the hardfork for Polygon Testnet
 */

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'polygon amoy testnet',
    networkId: (coins.get('tpolygon').network as EthereumNetwork).chainId,
    chainId: (coins.get('tpolygon').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
    hardfork: 'london',
    eips: [1559],
  }
);

/**
 * A Common object defining the chain and the hardfork for Polygon Mainnet
 */
export const mainnetCommon = EthereumCommon.forCustomChain(
  'mainnet',
  {
    name: 'polygon mainnet',
    networkId: (coins.get('polygon').network as EthereumNetwork).chainId,
    chainId: (coins.get('polygon').network as EthereumNetwork).chainId,
  },
  'london'
);
