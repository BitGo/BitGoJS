import { BitGoBase } from '@bitgo/sdk-core';
import { Bnb } from './bnb';
import { BnbToken } from './bnbToken';
import { Tbnb } from './tbnb';

export const register = (sdk: BitGoBase): void => {
  sdk.register('bnb', Bnb.createInstance);
  sdk.register('tbnb', Tbnb.createInstance);
  BnbToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
