import { BitGoBase } from '@bitgo/sdk-core';
import { Txrp } from './txrp';
import { Xrp } from './xrp';

export const register = (sdk: BitGoBase): void => {
  sdk.register('xrp', Xrp.createInstance);
  sdk.register('txrp', Txrp.createInstance);
};
