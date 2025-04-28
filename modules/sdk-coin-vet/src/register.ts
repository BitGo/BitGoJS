import { BitGoBase } from '@bitgo/sdk-core';
import { Vet } from './vet';
import { Tvet } from './tvet';

export const register = (sdk: BitGoBase): void => {
  sdk.register('vet', Vet.createInstance);
  sdk.register('tvet', Tvet.createInstance);
};
