import { BitGoBase } from '@bitgo/sdk-core';
import { Init } from './init';
import { Tinit } from './tinit';

export const register = (sdk: BitGoBase): void => {
  sdk.register('init', Init.createInstance);
  sdk.register('tinit', Tinit.createInstance);
};
