import { BitGoBase } from '@bitgo/sdk-core';
import { Opeth } from './opeth';
import { Topeth } from './topeth';
import { OpethToken } from './opethToken';

export const register = (sdk: BitGoBase): void => {
  sdk.register('opeth', Opeth.createInstance);
  sdk.register('topeth', Topeth.createInstance);
  OpethToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
