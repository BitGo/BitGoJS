import { BitGoBase } from '@bitgo/sdk-core';
import { Sei } from './sei';
import { Tsei } from './tsei';

export const register = (sdk: BitGoBase): void => {
  sdk.register('sei', Sei.createInstance);
  sdk.register('tsei', Tsei.createInstance);
};
