import { BitGoBase } from '@bitgo-beta/sdk-core';
import { Osmo } from './osmo';
import { Tosmo } from './tosmo';

export const register = (sdk: BitGoBase): void => {
  sdk.register('osmo', Osmo.createInstance);
  sdk.register('tosmo', Tosmo.createInstance);
};
