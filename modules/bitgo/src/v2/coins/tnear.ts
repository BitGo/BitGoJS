import { BitGo } from '../../bitgo';
import { Near } from './near';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';

export class TNear extends Near {

  constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }
}
