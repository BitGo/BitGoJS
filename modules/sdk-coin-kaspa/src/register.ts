import { BitGoBase } from '@bitgo/sdk-core';
import { Kaspa } from './kaspa';
import { Tkaspa } from './tkaspa';

export const register = (sdk: BitGoBase): void => {
  sdk.register('kaspa', Kaspa.createInstance);
  sdk.register('tkaspa', Tkaspa.createInstance);
};
