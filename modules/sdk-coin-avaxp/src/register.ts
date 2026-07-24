import { BitGoBase } from '@bitgo/sdk-core';
import { AvaxP } from './avaxp';
import { TavaxP } from './tavaxp';

export const register = (sdk: BitGoBase): void => {
  sdk.register('avaxp', AvaxP.createInstance);
  sdk.register('tavaxp', TavaxP.createInstance);
};
