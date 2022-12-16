import { BitGoBase } from '@bitgo/sdk-core';
import { Btg } from './btg';

export const register = (sdk: BitGoBase): void => {
  sdk.register('btg', Btg.createInstance);
};
