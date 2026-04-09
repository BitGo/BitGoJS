import { BitGoBase } from '@bitgo/sdk-core';
import { Rune } from './rune';
import { Trune } from './trune';

export const register = (sdk: BitGoBase): void => {
  sdk.register('thorchain:rune', Rune.createInstance);
  sdk.register('tthorchain:rune', Trune.createInstance);
};
