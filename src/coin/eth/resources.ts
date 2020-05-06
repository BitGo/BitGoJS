import EthereumCommon from 'ethereumjs-common';

/**
 * A Common object defining the chain and the hardfork for Ethereum Testnet
 */
export const testnetCommon = EthereumCommon.forCustomChain(
  'kovan',
  {
    name: 'testnet',
    networkId: 42,
    chainId: 42,
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
    networkId: 1,
    chainId: 1,
  },
  'petersburg',
);
