import EthereumCommon from 'ethereumjs-common';

/**
 * A Common object defining the chain and the hardfork for CELO Testnet
 */
export const testnetCommon = EthereumCommon.forCustomChain(
  'mainnet', // It's a test net based on the main ethereum net
  {
    name: 'alfajores',
    networkId: 44787,
    chainId: 44787,
  },
  'petersburg',
);

/**
 * A Common object defining the chain and the hardfork for CELO Mainnet
 */
export const mainnetCommon = EthereumCommon.forCustomChain(
  'mainnet',
  {
    name: 'rc1',
    networkId: 42220,
    chainId: 42220,
  },
  'petersburg',
);
