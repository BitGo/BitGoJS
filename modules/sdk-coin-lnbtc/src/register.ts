import { BitGoBase } from '@bitgo/sdk-core';
import { Lnbtc } from './lnbtc';
import { Tlnbtc } from './tlnbtc';

export const register = (sdk: BitGoBase): void => {
  sdk.register('lnbtc', Lnbtc.createInstance);
  sdk.register('tlnbtc', Tlnbtc.createInstance);
};
