import { BitGoBase } from '@bitgo/sdk-core';
import { Hbar } from './hbar';
import { HbarToken } from './hbarToken';
import { Thbar } from './thbar';

export const register = (sdk: BitGoBase): void => {
  sdk.register('hbar', Hbar.createInstance);
  sdk.register('thbar', Thbar.createInstance);
  HbarToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
