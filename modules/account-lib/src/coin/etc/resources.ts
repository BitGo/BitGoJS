import EthereumCommon from 'ethereumjs-common';

/**
 * A Common object defining the chain and the hardfork for ETC Testnet
 */
export const testnetCommon = EthereumCommon.forCustomChain(
  'kovan', // actual name is mordor, but ethereumjs-common does not recognize that name
  {
    name: 'testnet',
    networkId: 7,
    chainId: 63,
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
    networkId: 61,
    chainId: 61,
  },
  'petersburg',
);
