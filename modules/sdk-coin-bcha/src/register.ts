import { BitGoBase } from '@bitgo/sdk-core';
import { Bcha } from './bcha';
import { Tbcha } from './tbcha';

export const register = (sdk: BitGoBase): void => {
  sdk.register('bcha', Bcha.createInstance);
  sdk.register('tbcha', Tbcha.createInstance);
};
