import { coins, EthereumNetwork } from '@bitgo/statics';
import EthereumCommon from '@ethereumjs/common';

/**
 * A Common object defining the chain and the hardfork for CELO Testnet
 */
export const testnetCommon = EthereumCommon.forCustomChain(
  'mainnet', // It's a test net based on the main ethereum net
  {
    name: 'alfajores',
    networkId: (coins.get('tcelo').network as EthereumNetwork).chainId,
    chainId: (coins.get('tcelo').network as EthereumNetwork).chainId,
  },
  'petersburg'
);

/**
 * A Common object defining the chain and the hardfork for CELO Mainnet
 */
export const mainnetCommon = EthereumCommon.forCustomChain(
  'mainnet',
  {
    name: 'rc1',
    networkId: (coins.get('celo').network as EthereumNetwork).chainId,
    chainId: (coins.get('celo').network as EthereumNetwork).chainId,
  },
  'petersburg'
);
