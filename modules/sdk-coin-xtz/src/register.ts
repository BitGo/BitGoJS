import { BitGoBase } from '@bitgo/sdk-core';
import { Txtz } from './txtz';
import { Xtz } from './xtz';

export const register = (sdk: BitGoBase): void => {
  sdk.register('xtz', Xtz.createInstance);
  sdk.register('txtz', Txtz.createInstance);
};
