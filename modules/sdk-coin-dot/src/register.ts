import { BitGoBase } from '@bitgo/sdk-core';
import { Dot } from './dot';
import { Tdot } from './tdot';

export const register = (sdk: BitGoBase): void => {
  sdk.register('dot', Dot.createInstance);
  sdk.register('tdot', Tdot.createInstance);
};
