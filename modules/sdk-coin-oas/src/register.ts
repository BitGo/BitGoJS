import { BitGoBase } from '@bitgo-beta/sdk-core';
import { Oas } from './oas';
import { Toas } from './toas';

export const register = (sdk: BitGoBase): void => {
  sdk.register('oas', Oas.createInstance);
  sdk.register('toas', Toas.createInstance);
};
