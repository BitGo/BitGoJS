import { BitGoBase } from '@bitgo/sdk-core';
import { Zketh } from './zketh';
import { Tzketh } from './tzketh';

export const register = (sdk: BitGoBase): void => {
  sdk.register('zketh', Zketh.createInstance);
  sdk.register('tzketh', Tzketh.createInstance);
};
