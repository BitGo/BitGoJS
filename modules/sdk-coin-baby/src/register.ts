import { BitGoBase } from '@bitgo/sdk-core';
import { Baby } from './baby';
import { Tbaby } from './tbaby';

export const register = (sdk: BitGoBase): void => {
  sdk.register('baby', Baby.createInstance);
  sdk.register('tbaby', Tbaby.createInstance);
};
