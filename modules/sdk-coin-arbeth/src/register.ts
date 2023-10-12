import { BitGoBase } from '@bitgo/sdk-core';
import { Arbeth } from './arbeth';
import { Tarbeth } from './tarbeth';

export const register = (sdk: BitGoBase): void => {
  sdk.register('arbeth', Arbeth.createInstance);
  sdk.register('tarbeth', Tarbeth.createInstance);
};
