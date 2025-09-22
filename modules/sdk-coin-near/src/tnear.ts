import { BaseCoin as StaticsBaseCoin } from '@bitgo-beta/statics';
import { BitGoBase } from '@bitgo-beta/sdk-core';
import { Near } from './near';

export class TNear extends Near {
  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }
}
