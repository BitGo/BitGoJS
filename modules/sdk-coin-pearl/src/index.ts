import { BitGoBase } from '@bitgo/sdk-core';
import { Pearl, Tpearl } from '@bitgo/abstract-utxo';

export { Pearl } from '@bitgo/abstract-utxo';
export { Tpearl } from '@bitgo/abstract-utxo';

export const register = (sdk: BitGoBase): void => {
  sdk.register('pearl', Pearl.createInstance);
  sdk.register('tpearl', Tpearl.createInstance);
};
