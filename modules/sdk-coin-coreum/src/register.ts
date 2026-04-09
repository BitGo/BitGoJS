import { BitGoBase } from '@bitgo/sdk-core';
import { Coreum } from './coreum';
import { Tcoreum } from './tcoreum';

export const register = (sdk: BitGoBase): void => {
  sdk.register('coreum', Coreum.createInstance);
  sdk.register('tcoreum', Tcoreum.createInstance);
};
