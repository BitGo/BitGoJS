import { BitGoBase } from '@bitgo/sdk-core';
import { Doge, Tdoge } from '@bitgo/abstract-utxo';

export { Doge } from '@bitgo/abstract-utxo';
export { Tdoge } from '@bitgo/abstract-utxo';

export const register = (sdk: BitGoBase): void => {
  sdk.register('doge', Doge.createInstance);
  sdk.register('tdoge', Tdoge.createInstance);
};
