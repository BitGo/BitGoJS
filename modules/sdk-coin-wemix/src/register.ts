import { BitGoBase } from '@bitgo/sdk-core';
import { Wemix } from './wemix';
import { Twemix } from './twemix';

export const register = (sdk: BitGoBase): void => {
  sdk.register('wemix', Wemix.createInstance);
  sdk.register('twemix', Twemix.createInstance);
};
