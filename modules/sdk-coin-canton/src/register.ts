import { BitGoBase } from '@bitgo/sdk-core';
import { Canton } from './canton';
import { Tcanton } from './tcanton';

export const register = (sdk: BitGoBase): void => {
  sdk.register('canton', Canton.createInstance);
  sdk.register('tcanton', Tcanton.createInstance);
};
