import { BitGoBase } from '@bitgo/sdk-core';
import { Mantra } from './mantra';
import { Tmantra } from './tmantra';

export const register = (sdk: BitGoBase): void => {
  sdk.register('mantra', Mantra.createInstance);
  sdk.register('tmantra', Tmantra.createInstance);
};
