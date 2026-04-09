import { BitGoBase } from '@bitgo/sdk-core';
import { Mon } from './mon';
import { Tmon } from './tmon';
import { MonToken } from './monToken';

export const register = (sdk: BitGoBase): void => {
  sdk.register('mon', Mon.createInstance);
  sdk.register('tmon', Tmon.createInstance);
  MonToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
