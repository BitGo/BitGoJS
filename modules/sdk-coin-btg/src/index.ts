import { BitGoBase } from '@bitgo/sdk-core';
import { Btg } from '@bitgo/abstract-utxo';

export { Btg } from '@bitgo/abstract-utxo';

export const register = (sdk: BitGoBase): void => {
  sdk.register('btg', Btg.createInstance);
};
