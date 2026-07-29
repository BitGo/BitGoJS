import { BitGoBase } from '@bitgo/sdk-core';
import { Cspr } from './cspr';
import { Tcspr } from './tcspr';

export const register = (sdk: BitGoBase): void => {
  sdk.register('cspr', Cspr.createInstance);
  sdk.register('tcspr', Tcspr.createInstance);
};
