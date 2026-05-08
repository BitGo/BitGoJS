import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.forCustomChain(
  'mainnet',
  {
    name: 'testnet',
    networkId: (coins.get('tbsc').network as EthereumNetwork).chainId,
    chainId: (coins.get('tbsc').network as EthereumNetwork).chainId,
  },
  'petersburg'
);

export const mainnetCommon = EthereumCommon.forCustomChain(
  'mainnet',
  {
    name: 'mainnet',
    networkId: (coins.get('bsc').network as EthereumNetwork).chainId,
    chainId: (coins.get('bsc').network as EthereumNetwork).chainId,
  },
  'petersburg'
);
