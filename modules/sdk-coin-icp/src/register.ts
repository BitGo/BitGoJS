import { BitGoBase } from '@bitgo/sdk-core';
import { Icp } from './icp';
import { Ticp } from './ticp';

export const register = (sdk: BitGoBase): void => {
  sdk.register('icp', Icp.createInstance);
  sdk.register('ticp', Ticp.createInstance);
};
