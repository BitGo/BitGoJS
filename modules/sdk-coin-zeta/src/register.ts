import { BitGoBase } from '@bitgo/sdk-core';
import { Zeta } from './zeta';
import { Tzeta } from './tzeta';

export const register = (sdk: BitGoBase): void => {
  sdk.register('zeta', Zeta.createInstance);
  sdk.register('tzeta', Tzeta.createInstance);
};
