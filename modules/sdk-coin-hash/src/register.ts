import { BitGoBase } from '@bitgo-beta/sdk-core';
import { Hash } from './hash';
import { Thash } from './thash';
import { HashToken } from './hashToken';

export const register = (sdk: BitGoBase): void => {
  sdk.register('hash', Hash.createInstance);
  sdk.register('thash', Thash.createInstance);
  HashToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
