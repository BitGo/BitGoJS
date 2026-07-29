import { BitGoBase } from '@bitgo/sdk-core';
import { Kaspa, Tkaspa } from './kaspa';

export const register = (sdk: BitGoBase): void => {
  sdk.register('kaspa', Kaspa.createInstance);
  sdk.register('tkaspa', Tkaspa.createInstance);
};
