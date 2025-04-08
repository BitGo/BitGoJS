import { BitGoBase } from '@bitgo/sdk-core';
import { Polyx } from './polyx';
import { Tpolyx } from './tpolyx';

export const register = (sdk: BitGoBase): void => {
  sdk.register('polyx', Polyx.createInstance);
  sdk.register('tpolyx', Tpolyx.createInstance);
};
