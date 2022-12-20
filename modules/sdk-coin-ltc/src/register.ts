import { BitGoBase } from '@bitgo/sdk-core';
import { Ltc } from './ltc';
import { Tltc } from './tltc';

export const register = (sdk: BitGoBase): void => {
  sdk.register('ltc', Ltc.createInstance);
  sdk.register('tltc', Tltc.createInstance);
};
