import { BitGoBase } from '@bitgo/sdk-core';
import { Tzec } from './tzec';
import { Zec } from './zec';

export const register = (sdk: BitGoBase): void => {
  sdk.register('zec', Zec.createInstance);
  sdk.register('tzec', Tzec.createInstance);
};
