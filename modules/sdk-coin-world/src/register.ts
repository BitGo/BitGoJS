import { BitGoBase } from '@bitgo/sdk-core';
import { Wld } from './wld';
import { Twld } from './twld';

export const register = (sdk: BitGoBase): void => {
  sdk.register('wld', Wld.createInstance);
  sdk.register('twld', Twld.createInstance);
};
