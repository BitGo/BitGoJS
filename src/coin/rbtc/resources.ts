import EthereumCommon from 'ethereumjs-common';

/**
 * A Common object defining the chain and the hardfork for RSK Testnet
 */
export const testnetCommon = EthereumCommon.forCustomChain(
  'ropsten',
  {
    name: 'testnet',
    networkId: 31,
    chainId: 31,
  },
  'petersburg',
);

/**
 * A Common object defining the chain and the hardfork for RSK Mainnet
 */
export const mainnetCommon = EthereumCommon.forCustomChain(
  'mainnet',
  {
    name: 'mainnet',
    networkId: 30,
    chainId: 30,
  },
  'petersburg',
);
