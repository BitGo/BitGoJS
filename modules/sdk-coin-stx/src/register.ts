import { BitGoBase } from '@bitgo/sdk-core';
import { Stx } from './stx';
import { Tstx } from './tstx';
import { Tstxsignet } from './tstxsignet';
import { Sip10Token } from './sip10Token';

export const register = (sdk: BitGoBase): void => {
  sdk.register('stx', Stx.createInstance);
  sdk.register('tstx', Tstx.createInstance);
  sdk.register('tstxsignet', Tstxsignet.createInstance);
  Sip10Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
