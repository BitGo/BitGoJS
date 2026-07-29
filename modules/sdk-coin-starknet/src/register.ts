import { BitGoBase } from '@bitgo/sdk-core';
import { Starknet } from './starknet';

export const register = (sdk: BitGoBase): void => {
  sdk.register('starknet', Starknet.createInstance);
  sdk.register('tstarknet', Starknet.createInstance);
};
