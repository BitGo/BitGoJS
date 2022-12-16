import { BitGoBase } from '@bitgo/sdk-core';
import { Stx } from './stx';
import { Tstx } from './tstx';

export const register = (sdk: BitGoBase): void => {
  sdk.register('stx', Stx.createInstance);
  sdk.register('tstx', Tstx.createInstance);
};
