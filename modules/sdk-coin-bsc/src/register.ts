import { BitGoBase } from '@bitgo/sdk-core';
import { Bsc } from './bsc';
import { BscToken } from './bscToken';
import { Tbsc } from './tbsc';

export const register = (sdk: BitGoBase): void => {
  sdk.register('bsc', Bsc.createInstance);
  sdk.register('tbsc', Tbsc.createInstance);
  BscToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
