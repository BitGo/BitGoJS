import { coins, EthereumNetwork } from '@bitgo/statics';
import EthereumCommon from 'ethereumjs-common';

/**
 * A Common object defining the chain and the hardfork for Ethereum Testnet
 */
export const testnetCommon = EthereumCommon.forCustomChain(
  'kovan',
  {
    name: 'testnet',
    networkId: (coins.get('teth').network as EthereumNetwork).chainId,
    chainId: (coins.get('teth').network as EthereumNetwork).chainId,
  },
  'petersburg',
);

/**
 * A Common object defining the chain and the hardfork for Ethereum Mainnet
 */
export const mainnetCommon = EthereumCommon.forCustomChain(
  'mainnet',
  {
    name: 'mainnet',
    networkId: (coins.get('eth').network as EthereumNetwork).chainId,
    chainId: (coins.get('eth').network as EthereumNetwork).chainId,
  },
  'petersburg',
);
