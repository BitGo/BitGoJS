import { BitGoBase } from '@bitgo/sdk-core';
import { Xdc } from './xdc';
import { Txdc } from './txdc';

export const register = (sdk: BitGoBase): void => {
  sdk.register('xdc', Xdc.createInstance);
  sdk.register('txdc', Txdc.createInstance);
};
