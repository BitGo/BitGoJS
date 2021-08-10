import { coins, EthereumNetwork } from '@bitgo/statics';
import EthereumCommon from '@ethereumjs/common';

/**
 * A Common object defining the chain and the hardfork for ETC Testnet
 */
export const testnetCommon = EthereumCommon.forCustomChain(
  'ropsten',
  {
    name: 'testnet',
    networkId: (coins.get('tavaxc').network as EthereumNetwork).chainId,
    chainId: (coins.get('tavaxc').network as EthereumNetwork).chainId,
  },
  'petersburg',
);

/**
 * A Common object defining the chain and the hardfork for ETC Mainnet
 */
export const mainnetCommon = EthereumCommon.forCustomChain(
  'mainnet',
  {
    name: 'mainnet',
    networkId: (coins.get('tavaxc').network as EthereumNetwork).chainId,
    chainId: (coins.get('tavaxc').network as EthereumNetwork).chainId,
  },
  'petersburg',
);
