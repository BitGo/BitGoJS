import { BitGoBase } from '@bitgo/sdk-core';
import { Asi } from './asi';
import { Tasi } from './tasi';

export const register = (sdk: BitGoBase): void => {
  sdk.register('asi', Asi.createInstance);
  sdk.register('tasi', Tasi.createInstance);
};
