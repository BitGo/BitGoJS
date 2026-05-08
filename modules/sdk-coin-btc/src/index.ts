import { BitGoBase } from '@bitgo/sdk-core';
import { Btc, Tbtc, Tbtc4, Tbtcsig, Tbtcbgsig } from '@bitgo/abstract-utxo';

export { Btc, VerifyRecoveryTransactionOptions, InscriptionBuilder } from '@bitgo/abstract-utxo';
export { Tbtc } from '@bitgo/abstract-utxo';
export { Tbtcsig } from '@bitgo/abstract-utxo';
export { Tbtc4 } from '@bitgo/abstract-utxo';
export { Tbtcbgsig } from '@bitgo/abstract-utxo';

export const register = (sdk: BitGoBase): void => {
  sdk.register('btc', Btc.createInstance);
  sdk.register('tbtc', Tbtc.createInstance);
  sdk.register('tbtcsig', Tbtcsig.createInstance);
  sdk.register('tbtcbgsig', Tbtcbgsig.createInstance);
  sdk.register('tbtc4', Tbtc4.createInstance);
};
