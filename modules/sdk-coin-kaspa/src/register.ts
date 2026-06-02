import { BitGoBase } from '@bitgo/sdk-core';
import { Kaspa, Tkaspa } from './kaspa';

export const register = (sdk: BitGoBase): void => {
  sdk.register('kas', Kaspa.createInstance);
  sdk.register('tkas', Tkaspa.createInstance);
};
