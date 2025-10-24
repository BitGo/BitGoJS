import { BitGoBase } from '@bitgo/sdk-core';
import { Dash, Tdash } from '@bitgo/abstract-utxo';

export { Dash } from '@bitgo/abstract-utxo';
export { Tdash } from '@bitgo/abstract-utxo';

export const register = (sdk: BitGoBase): void => {
  sdk.register('dash', Dash.createInstance);
  sdk.register('tdash', Tdash.createInstance);
};
