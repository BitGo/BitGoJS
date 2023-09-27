import { BitGoBase } from '@bitgo/sdk-core';
import { Kava } from './kava';
import { Tkava } from './tkava';

export const register = (sdk: BitGoBase): void => {
  sdk.register('kava', Kava.createInstance);
  sdk.register('tkava', Tkava.createInstance);
};
