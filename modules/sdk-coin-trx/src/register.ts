import { BitGoBase } from '@bitgo/sdk-core';
import { Trx } from './trx';
import { TrxToken } from './trxToken';
import { Ttrx } from './ttrx';

export const register = (sdk: BitGoBase): void => {
  sdk.register('trx', Trx.createInstance);
  sdk.register('ttrx', Ttrx.createInstance);
  TrxToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
