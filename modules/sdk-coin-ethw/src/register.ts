import { BitGoBase } from '@bitgo-beta/sdk-core';
import { Ethw } from './ethw';

export const register = (sdk: BitGoBase): void => {
  sdk.register('ethw', Ethw.createInstance);
};
