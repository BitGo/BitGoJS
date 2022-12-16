import { BitGoBase } from '@bitgo/sdk-core';
import { Sui } from './sui';
import { Tsui } from './tsui';

export const register = (sdk: BitGoBase): void => {
  sdk.register('sui', Sui.createInstance);
  sdk.register('tsui', Tsui.createInstance);
};
