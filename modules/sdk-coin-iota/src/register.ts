import { BitGoBase } from '@bitgo-beta/sdk-core';
import { Iota } from './iota';

export const register = (sdk: BitGoBase): void => {
  sdk.register('iota', Iota.createInstance);
  sdk.register('tiota', Iota.createInstance);
};
