import { BitGoBase } from '@bitgo/sdk-core';
import { Sol } from './sol';
import { SolToken } from './solToken';
import { Tsol } from './tsol';

export const register = (sdk: BitGoBase): void => {
  sdk.register('sol', Sol.createInstance);
  sdk.register('tsol', Tsol.createInstance);
  SolToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
