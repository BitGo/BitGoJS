import { BitGoBase } from '@bitgo/sdk-core';
import { Canton } from './canton';
import { Tcanton } from './tcanton';
import { CantonToken } from './cantonToken';

export const register = (sdk: BitGoBase): void => {
  sdk.register('canton', Canton.createInstance);
  sdk.register('tcanton', Tcanton.createInstance);
  CantonToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
