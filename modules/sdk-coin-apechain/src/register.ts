import { BitGoBase } from '@bitgo/sdk-core';
import { Apechain } from './apechain';
import { Tapechain } from './tapechain';

export const register = (sdk: BitGoBase): void => {
  sdk.register('apechain', Apechain.createInstance);
  sdk.register('tapechain', Tapechain.createInstance);
};
