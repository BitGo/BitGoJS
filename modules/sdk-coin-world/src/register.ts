import { BitGoBase } from '@bitgo/sdk-core';
import { World } from './world';
import { Tworld } from './tworld';
import { WorldToken } from './worldToken';

export const register = (sdk: BitGoBase): void => {
  sdk.register('world', World.createInstance);
  sdk.register('tworld', Tworld.createInstance);
  WorldToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
