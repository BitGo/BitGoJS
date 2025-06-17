import { BitGoBase } from '@bitgo/sdk-core';
import { Vet } from './vet';
import { Tvet } from './tvet';
import { VetToken } from './vetToken';

export const register = (sdk: BitGoBase): void => {
  sdk.register('vet', Vet.createInstance);
  sdk.register('tvet', Tvet.createInstance);
  VetToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
