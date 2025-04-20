import { BitGoBase } from '@bitgo/sdk-core';
import { Mon } from './mon';
import { Tmon } from './tmon';

export const register = (sdk: BitGoBase): void => {
  sdk.register('mon', Mon.createInstance);
  sdk.register('tmon', Tmon.createInstance);
};
