import { BitGoBase } from '@bitgo/sdk-core';
import { Xpr } from './xpr';
import { Txpr } from './txpr';

export const register = (sdk: BitGoBase): void => {
  sdk.register('xpr', Xpr.createInstance);
  sdk.register('txpr', Txpr.createInstance);
};
