import { BitGoBase } from '@bitgo/sdk-core';
import { Bsv } from './bsv';
import { Tbsv } from './tbsv';

export const register = (sdk: BitGoBase): void => {
  sdk.register('bsv', Bsv.createInstance);
  sdk.register('tbsv', Tbsv.createInstance);
};
