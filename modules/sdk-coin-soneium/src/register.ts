import { BitGoBase } from '@bitgo/sdk-core';
import { Soneium } from './soneium';
import { Tsoneium } from './tsoneium';
import { SoneiumToken } from './soneiumToken';

export const register = (sdk: BitGoBase): void => {
  sdk.register('soneium', Soneium.createInstance);
  sdk.register('tsoneium', Tsoneium.createInstance);
  SoneiumToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
