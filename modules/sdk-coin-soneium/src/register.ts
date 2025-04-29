import { BitGoBase } from '@bitgo/sdk-core';
import { Soneium } from './soneium';
import { Tsoneium } from './tsoneium';

export const register = (sdk: BitGoBase): void => {
  sdk.register('soneium', Soneium.createInstance);
  sdk.register('tsoneium', Tsoneium.createInstance);
};
