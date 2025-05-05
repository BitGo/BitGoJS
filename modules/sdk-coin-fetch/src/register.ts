import { BitGoBase } from '@bitgo/sdk-core';
import { Fetch } from './fetch';
import { Tfetch } from './tfetch';

export const register = (sdk: BitGoBase): void => {
  sdk.register('fetch', Fetch.createInstance);
  sdk.register('tfetch', Tfetch.createInstance);
};
