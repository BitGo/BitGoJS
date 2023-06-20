import { BitGoBase } from '@bitgo/sdk-core';
import { Inj } from './inj';
import { Tinj } from './tinj';

export const register = (sdk: BitGoBase): void => {
  sdk.register('inj', Inj.createInstance);
  sdk.register('tinj', Tinj.createInstance);
};
