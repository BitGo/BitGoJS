import { BitGoBase } from '@bitgo/sdk-core';
import { Bera } from './bera';
import { Tbera } from './tbera';
import { BeraToken } from './beraToken';

export const register = (sdk: BitGoBase): void => {
  sdk.register('bera', Bera.createInstance);
  sdk.register('tbera', Tbera.createInstance);
  BeraToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
