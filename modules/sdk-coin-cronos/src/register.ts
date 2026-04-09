import { BitGoBase } from '@bitgo/sdk-core';
import { Cronos } from './cronos';
import { Tcronos } from './tcronos';

export const register = (sdk: BitGoBase): void => {
  sdk.register('cronos', Cronos.createInstance);
  sdk.register('tcronos', Tcronos.createInstance);
};
