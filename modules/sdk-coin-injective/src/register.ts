import { BitGoBase } from '@bitgo/sdk-core';
import { Injective } from './injective';
import { Tinjective } from './tinjective';

export const register = (sdk: BitGoBase): void => {
  sdk.register('injective', Injective.createInstance);
  sdk.register('tinjective', Tinjective.createInstance);
};
