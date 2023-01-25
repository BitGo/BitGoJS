import { BitGoBase } from '@bitgo/sdk-core';
import { Atom } from './atom';
import { Tatom } from './tatom';

export const register = (sdk: BitGoBase): void => {
  sdk.register('atom', Atom.createInstance);
  sdk.register('tatom', Tatom.createInstance);
};
