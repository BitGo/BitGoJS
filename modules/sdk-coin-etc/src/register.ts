import { BitGoBase } from '@bitgo/sdk-core';
import { Etc } from './etc';
import { Tetc } from './tetc';

export const register = (sdk: BitGoBase): void => {
  sdk.register('etc', Etc.createInstance);
  sdk.register('tetc', Tetc.createInstance);
};
