import { BitGoBase } from '@bitgo/sdk-core';
import { Rbtc } from './rbtc';
import { Trbtc } from './trbtc';

export const register = (sdk: BitGoBase): void => {
  sdk.register('rbtc', Rbtc.createInstance);
  sdk.register('trbtc', Trbtc.createInstance);
};
