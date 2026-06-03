import { BitGoBase } from '@bitgo/sdk-core';
import { Solayer } from './solayer';
import { Tsolayer } from './tsolayer';

export const register = (sdk: BitGoBase): void => {
  sdk.register('solayer', Solayer.createInstance);
  sdk.register('tsolayer', Tsolayer.createInstance);
};
