import { BitGoBase } from '@bitgo/sdk-core';
import { Dash } from './dash';
import { Tdash } from './tdash';

export const register = (sdk: BitGoBase): void => {
  sdk.register('dash', Dash.createInstance);
  sdk.register('tdash', Tdash.createInstance);
};
