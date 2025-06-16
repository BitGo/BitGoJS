import { BitGoBase } from '@bitgo/sdk-core';
import { Apecoin } from './apecoin';
import { Tapecoin } from './tapecoin';

export const register = (sdk: BitGoBase): void => {
  sdk.register('apecoin', Apecoin.createInstance);
  sdk.register('tapecoin', Tapecoin.createInstance);
};
