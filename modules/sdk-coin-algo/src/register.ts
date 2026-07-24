import { BitGoBase } from '@bitgo/sdk-core';
import { Algo } from './algo';
import { AlgoToken } from './algoToken';
import { Talgo } from './talgo';

export const register = (sdk: BitGoBase): void => {
  sdk.register('algo', Algo.createInstance);
  sdk.register('talgo', Talgo.createInstance);
  AlgoToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
