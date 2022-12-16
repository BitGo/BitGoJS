import { BitGoBase } from '@bitgo/sdk-core';
import { Eth2 } from './eth2';
import { Teth2 } from './teth2';

export const register = (sdk: BitGoBase): void => {
  sdk.register('eth2', Eth2.createInstance);
  sdk.register('teth2', Teth2.createInstance);
};
