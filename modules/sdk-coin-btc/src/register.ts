import { BitGoBase } from '@bitgo/sdk-core';
import { Btc } from './btc';
import { Tbtc } from './tbtc';
import { Tbtcsig } from './tbtcsig';
import { Tbtcbgsig } from './tbtcbgsig';

export const register = (sdk: BitGoBase): void => {
  sdk.register('btc', Btc.createInstance);
  sdk.register('tbtc', Tbtc.createInstance);
  sdk.register('tbtcsig', Tbtcsig.createInstance);
  sdk.register('tbtcbgsig', Tbtcbgsig.createInstance);
};
