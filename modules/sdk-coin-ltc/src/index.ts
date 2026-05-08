import { BitGoBase } from '@bitgo/sdk-core';
import { Ltc, Tltc } from '@bitgo/abstract-utxo';

export { Ltc } from '@bitgo/abstract-utxo';
export { Tltc } from '@bitgo/abstract-utxo';

export const register = (sdk: BitGoBase): void => {
  sdk.register('ltc', Ltc.createInstance);
  sdk.register('tltc', Tltc.createInstance);
};
