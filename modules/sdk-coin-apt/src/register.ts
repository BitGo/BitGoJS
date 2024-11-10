import { BitGoBase } from '@bitgo/sdk-core';
import { Apt } from './apt';
import { Tapt } from './tapt';

export const register = (sdk: BitGoBase): void => {
  sdk.register('apt', Apt.createInstance);
  sdk.register('tapt', Tapt.createInstance);
};
