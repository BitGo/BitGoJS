import { BitGoBase } from '@bitgo/sdk-core';
import { Bch } from './bch';
import { Tbch } from './tbch';

export const register = (sdk: BitGoBase): void => {
  sdk.register('bch', Bch.createInstance);
  sdk.register('tbch', Tbch.createInstance);
};
