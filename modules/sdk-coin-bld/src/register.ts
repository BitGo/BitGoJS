import { BitGoBase } from '@bitgo/sdk-core';
import { Bld } from './bld';
import { Tbld } from './tbld';

export const register = (sdk: BitGoBase): void => {
  sdk.register('bld', Bld.createInstance);
  sdk.register('tbld', Tbld.createInstance);
};
