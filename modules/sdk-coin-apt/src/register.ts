import { BitGoBase } from '@bitgo/sdk-core';
import { Apt } from './apt';
import { Tapt } from './tapt';
import { AptToken } from './aptToken';

export const register = (sdk: BitGoBase): void => {
  sdk.register('apt', Apt.createInstance);
  sdk.register('tapt', Tapt.createInstance);
  AptToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
