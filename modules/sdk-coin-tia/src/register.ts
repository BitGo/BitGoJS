import { BitGoBase } from '@bitgo/sdk-core';
import { Tia } from './tia';
import { Ttia } from './ttia';

export const register = (sdk: BitGoBase): void => {
  sdk.register('tia', Tia.createInstance);
  sdk.register('ttia', Ttia.createInstance);
};
