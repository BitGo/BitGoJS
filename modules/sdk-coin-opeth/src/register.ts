import { BitGoBase } from '@bitgo/sdk-core';
import { Opeth } from './opeth';
import { Topeth } from './topeth';

export const register = (sdk: BitGoBase): void => {
  sdk.register('opeth', Opeth.createInstance);
  sdk.register('topeth', Topeth.createInstance);
};
