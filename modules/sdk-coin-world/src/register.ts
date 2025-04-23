import { BitGoBase } from '@bitgo/sdk-core';
import { World } from './world';
import { Tworld } from './tworld';

export const register = (sdk: BitGoBase): void => {
  sdk.register('world', World.createInstance);
  sdk.register('tworld', Tworld.createInstance);
};
