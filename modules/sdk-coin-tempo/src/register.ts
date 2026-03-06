import { BitGoBase } from '@bitgo/sdk-core';
import { Tempo } from './tempo';
import { Ttempo } from './ttempo';
import { Tip20Token } from './tip20Token';

export const register = (sdk: BitGoBase): void => {
  sdk.register('tempo', Tempo.createInstance);
  sdk.register('ttempo', Ttempo.createInstance);
  Tip20Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
