import { BitGoBase } from '@bitgo/sdk-core';
import { Tao } from './tao';
import { Ttao } from './ttao';

export const register = (sdk: BitGoBase): void => {
  sdk.register('tao', Tao.createInstance);
  sdk.register('ttao', Ttao.createInstance);
};
