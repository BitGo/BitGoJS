import { BitGoBase } from '@bitgo/sdk-core';
import { Coredao } from './coredao';
import { Tcoredao } from './tcoredao';

export const register = (sdk: BitGoBase): void => {
  sdk.register('coredao', Coredao.createInstance);
  sdk.register('tcoredao', Tcoredao.createInstance);
};
