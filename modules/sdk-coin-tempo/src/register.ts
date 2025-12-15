import { BitGoBase } from '@bitgo/sdk-core';
import { Tempo } from './tempo';
import { Ttempo } from './ttempo';

export const register = (sdk: BitGoBase): void => {
  sdk.register('tempo', Tempo.createInstance);
  sdk.register('ttempo', Ttempo.createInstance);
};
