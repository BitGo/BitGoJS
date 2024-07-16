import { BitGoBase } from '@bitgo/sdk-core';
import { Sui } from './sui';
import { Tsui } from './tsui';
import { SuiToken } from './suiToken';

export const register = (sdk: BitGoBase): void => {
  sdk.register('sui', Sui.createInstance);
  sdk.register('tsui', Tsui.createInstance);
  SuiToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
