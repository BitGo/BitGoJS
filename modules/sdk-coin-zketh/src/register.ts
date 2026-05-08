import { BitGoBase } from '@bitgo/sdk-core';
import { Zketh } from './zketh';
import { Tzketh } from './tzketh';
import { ZkethToken } from './zkethToken';

export const register = (sdk: BitGoBase): void => {
  sdk.register('zketh', Zketh.createInstance);
  sdk.register('tzketh', Tzketh.createInstance);
  ZkethToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
