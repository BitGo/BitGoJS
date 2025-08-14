import { BitGoBase } from '@bitgo/sdk-core';
import { Tstt } from './tstt';

export const register = (sdk: BitGoBase): void => {
  sdk.register('tstt', Tstt.createInstance);
};
