import { BitGoBase } from '@bitgo/sdk-core';
import { Near } from './near';
import { TNear } from './tnear';
import { Nep141Token } from './nep141Token';

export const register = (sdk: BitGoBase): void => {
  sdk.register('near', Near.createInstance);
  sdk.register('tnear', TNear.createInstance);
  Nep141Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
