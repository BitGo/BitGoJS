import { BitGoBase } from '@bitgo/sdk-core';
import { Zec, Tzec } from '@bitgo/abstract-utxo';

export { Zec } from '@bitgo/abstract-utxo';
export { Tzec } from '@bitgo/abstract-utxo';

export const register = (sdk: BitGoBase): void => {
  sdk.register('zec', Zec.createInstance);
  sdk.register('tzec', Tzec.createInstance);
};
