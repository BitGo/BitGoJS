import { BitGoBase } from '@bitgo/sdk-core';
import { Doge } from './doge';
import { Tdoge } from './tdoge';

export const register = (sdk: BitGoBase): void => {
  sdk.register('doge', Doge.createInstance);
  sdk.register('tdoge', Tdoge.createInstance);
};
