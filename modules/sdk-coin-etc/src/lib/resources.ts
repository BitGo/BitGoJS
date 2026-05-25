import { coins, EthereumNetwork } from '@bitgo/statics';
import EthereumCommon from '@ethereumjs/common';

/**
 * A Common object defining the chain and the hardfork for ETC Testnet
 */
export const testnetCommon = EthereumCommon.forCustomChain(
  'kovan', // actual name is mordor, but ethereumjs-common does not recognize that name
  {
    name: 'testnet',
    networkId: (coins.get('tetc').network as EthereumNetwork).chainId,
    chainId: (coins.get('tetc').network as EthereumNetwork).chainId,
  },
  'petersburg'
);

/**
 * A Common object defining the chain and the hardfork for ETC Mainnet
 */
export const mainnetCommon = EthereumCommon.forCustomChain(
  'mainnet',
  {
    name: 'mainnet',
    networkId: (coins.get('etc').network as EthereumNetwork).chainId,
    chainId: (coins.get('etc').network as EthereumNetwork).chainId,
  },
  'petersburg'
);
