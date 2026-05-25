import { BitGoBase } from '@bitgo/sdk-core';
import { Initia } from './initia';
import { Tinitia } from './tinitia';

export const register = (sdk: BitGoBase): void => {
  sdk.register('initia', Initia.createInstance);
  sdk.register('tinitia', Tinitia.createInstance);
};
