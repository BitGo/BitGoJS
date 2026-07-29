import { BitGoBase } from '@bitgo/sdk-core';
import { Bcha, Tbcha } from '@bitgo/abstract-utxo';

export { Bcha } from '@bitgo/abstract-utxo';
export { Tbcha } from '@bitgo/abstract-utxo';

export const register = (sdk: BitGoBase): void => {
  sdk.register('bcha', Bcha.createInstance);
  sdk.register('tbcha', Tbcha.createInstance);
};
