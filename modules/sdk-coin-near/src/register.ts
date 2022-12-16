import { BitGoBase } from '@bitgo/sdk-core';
import { Near } from './near';
import { TNear } from './tnear';

export const register = (sdk: BitGoBase): void => {
  sdk.register('near', Near.createInstance);
  sdk.register('tnear', TNear.createInstance);
};
