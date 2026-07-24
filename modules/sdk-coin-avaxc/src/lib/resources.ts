import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

/**
 * A Common object defining the chain
 * TODO BG-35011: create custom Common object since Avalanche doesn't have hardforks
 */
export const testnetCommon = EthereumCommon.forCustomChain(
  'mainnet',
  {
    name: 'fuji',
    networkId: 1,
    chainId: (coins.get('tavaxc').network as EthereumNetwork).chainId,
  },
  'london'
);

/**
 * A Common object defining the chain
 * TODO BG-35011: create custom Common object since Avalanche doesn't have hardforks
 */
export const mainnetCommon = EthereumCommon.forCustomChain(
  'mainnet',
  {
    name: 'mainnet',
    networkId: 1,
    chainId: (coins.get('avaxc').network as EthereumNetwork).chainId,
  },
  'london'
);
