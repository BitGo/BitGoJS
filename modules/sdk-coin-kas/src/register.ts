import { BitGoBase } from '@bitgo/sdk-core';
import { Kas } from './kas';
import { Tkas } from './tkas';

export const register = (sdk: BitGoBase): void => {
  sdk.register('kas', Kas.createInstance);
  sdk.register('tkas', Tkas.createInstance);
};
