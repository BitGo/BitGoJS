import { BitGoBase } from '@bitgo/sdk-core';
import { Ada } from './ada';
import { Tada } from './tada';
import { AdaToken } from './adaToken';

export const register = (sdk: BitGoBase): void => {
  sdk.register('ada', Ada.createInstance);
  sdk.register('tada', Tada.createInstance);
  AdaToken.createTokenConstructors().forEach(({ name, coinConstructor }) => sdk.register(name, coinConstructor));
};
