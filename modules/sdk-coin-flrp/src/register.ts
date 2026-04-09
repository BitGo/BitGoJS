import { BitGoBase } from '@bitgo/sdk-core';
import { Flrp } from './flrp';
import { TflrP } from './tflrp';

export const register = (sdk: BitGoBase): void => {
  sdk.register('flrp', Flrp.createInstance);
  sdk.register('tflrp', TflrP.createInstance);
};
