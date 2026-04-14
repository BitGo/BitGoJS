import { BitGoBase } from '@bitgo/sdk-core';
import { Kaspa } from './kas';
import { Tkaspa } from './tkas';

export const register = (sdk: BitGoBase): void => {
  sdk.register('kaspa', Kaspa.createInstance);
  sdk.register('tkaspa', Tkaspa.createInstance);
};
