import { BitGoBase } from '@bitgo/sdk-core';
import { Rune } from './rune';
import { Trune } from './trune';

export const register = (sdk: BitGoBase): void => {
  sdk.register('rune-native', Rune.createInstance);
  sdk.register('trune-native', Trune.createInstance);
};
