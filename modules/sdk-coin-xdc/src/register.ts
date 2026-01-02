import { BitGoBase } from '@bitgo/sdk-core';
import { EthLikeErc20Token } from '@bitgo/sdk-coin-evm';
import { Xdc } from './xdc';
import { Txdc } from './txdc';

export const register = (sdk: BitGoBase): void => {
  sdk.register('xdc', Xdc.createInstance);
  sdk.register('txdc', Txdc.createInstance);
  EthLikeErc20Token.createTokenConstructors({
    Mainnet: 'xdc',
    Testnet: 'txdc',
  }).forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
