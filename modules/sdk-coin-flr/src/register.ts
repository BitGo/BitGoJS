import { BitGoBase } from '@bitgo/sdk-core';
import { Flr } from './flr';
import { Tflr } from './tflr';

export const register = (sdk: BitGoBase): void => {
  sdk.register('flr', Flr.createInstance);
  sdk.register('tflr', Tflr.createInstance);
};
