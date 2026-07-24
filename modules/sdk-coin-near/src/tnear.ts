import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { BitGoBase } from '@bitgo/sdk-core';
import { Near } from './near';

export class TNear extends Near {
  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }
}
