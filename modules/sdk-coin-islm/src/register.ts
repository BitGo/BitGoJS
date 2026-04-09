import { BitGoBase } from '@bitgo/sdk-core';
import { Islm } from './islm';
import { Tislm } from './tislm';

export const register = (sdk: BitGoBase): void => {
  sdk.register('islm', Islm.createInstance);
  sdk.register('tislm', Tislm.createInstance);
};
