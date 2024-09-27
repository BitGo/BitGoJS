import { BitGoBase } from '@bitgo/sdk-core';
import { Rune } from './rune';
import { Trune } from './trune';

export const register = (sdk: BitGoBase): void => {
  sdk.register('core', Rune.createInstance);
  sdk.register('tcore', Trune.createInstance);
};
