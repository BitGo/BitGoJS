import { BitGoBase } from '@bitgo/sdk-core';
import { Arbeth } from './arbeth';
import { Tarbeth } from './tarbeth';
import { ArbethToken } from './arbethToken';

export const register = (sdk: BitGoBase): void => {
  sdk.register('arbeth', Arbeth.createInstance);
  sdk.register('tarbeth', Tarbeth.createInstance);
  ArbethToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
