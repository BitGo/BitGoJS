import { BitGoBase } from '@bitgo/sdk-core';
import { FetchAi } from './fetchai';
import { TfetchAi } from './tfetchai';

export const register = (sdk: BitGoBase): void => {
  sdk.register('fetchai', FetchAi.createInstance);
  sdk.register('tfetchai', TfetchAi.createInstance);
};
