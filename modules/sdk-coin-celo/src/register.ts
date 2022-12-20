import { BitGoBase } from '@bitgo/sdk-core';
import { Celo } from './celo';
import { CeloToken } from './celoToken';
import { Tcelo } from './tcelo';

export const register = (sdk: BitGoBase): void => {
  sdk.register('celo', Celo.createInstance);
  sdk.register('tcelo', Tcelo.createInstance);
  CeloToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
