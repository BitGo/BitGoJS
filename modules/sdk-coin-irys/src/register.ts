import { BitGoBase } from '@bitgo/sdk-core';
import { Irys } from './irys';
import { Tirys } from './tirys';

export const register = (sdk: BitGoBase): void => {
  sdk.register('irys', Irys.createInstance);
  sdk.register('tirys', Tirys.createInstance);
};
