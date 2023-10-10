import { BitGoBase } from '@bitgo/sdk-core';
import { Core } from './core';
import { Tcore } from './tcore';

export const register = (sdk: BitGoBase): void => {
  sdk.register('core', Core.createInstance);
  sdk.register('tcore', Tcore.createInstance);
};
