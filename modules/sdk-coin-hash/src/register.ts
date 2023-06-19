import { BitGoBase } from '@bitgo/sdk-core';
import { Hash } from './hash';
import { Thash } from './thash';

export const register = (sdk: BitGoBase): void => {
  sdk.register('hash', Hash.createInstance);
  sdk.register('thash', Thash.createInstance);
};
