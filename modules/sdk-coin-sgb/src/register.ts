import { BitGoBase } from '@bitgo/sdk-core';
import { Sgb } from './sgb';
import { Tsgb } from './tsgb';

export const register = (sdk: BitGoBase): void => {
  sdk.register('sgb', Sgb.createInstance);
  sdk.register('tsgb', Tsgb.createInstance);
};
