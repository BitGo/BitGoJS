import { BitGoBase } from '@bitgo/sdk-core';
import { Bsv, Tbsv } from '@bitgo/abstract-utxo';

export { Bsv } from '@bitgo/abstract-utxo';
export { Tbsv } from '@bitgo/abstract-utxo';

export const register = (sdk: BitGoBase): void => {
  sdk.register('bsv', Bsv.createInstance);
  sdk.register('tbsv', Tbsv.createInstance);
};
