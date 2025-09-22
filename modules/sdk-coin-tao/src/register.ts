import { BitGoBase } from '@bitgo-beta/sdk-core';
import { Tao } from './tao';
import { Ttao } from './ttao';
import { TaoToken } from './taoToken';

export const register = (sdk: BitGoBase): void => {
  sdk.register('tao', Tao.createInstance);
  sdk.register('ttao', Ttao.createInstance);
  TaoToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
