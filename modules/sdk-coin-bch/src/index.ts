import { BitGoBase } from '@bitgo/sdk-core';
import { Bch, Tbch } from '@bitgo/abstract-utxo';

export { Bch } from '@bitgo/abstract-utxo';
export { Tbch } from '@bitgo/abstract-utxo';

export const register = (sdk: BitGoBase): void => {
  sdk.register('bch', Bch.createInstance);
  sdk.register('tbch', Tbch.createInstance);
};
