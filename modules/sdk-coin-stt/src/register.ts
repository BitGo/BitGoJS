import { BitGoBase } from '@bitgo/sdk-core';
import { Stt } from './stt';
import { Tstt } from './tstt';

export const register = (sdk: BitGoBase): void => {
  sdk.register('stt', Stt.createInstance);
  sdk.register('tstt', Tstt.createInstance);
};
