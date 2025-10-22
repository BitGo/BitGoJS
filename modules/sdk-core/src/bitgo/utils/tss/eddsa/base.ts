import { IBaseCoin } from '../../../baseCoin';
import baseTSSUtils from '../baseTSSUtils';
import { KeyShare } from './types';
import { BitGoBase } from '../../../bitgoBase';
import { IWallet } from '../../../wallet';

/**
 * @inheritdoc
 * Base class for EDDSA TSS utilities.
 * Provides common functionality shared between EDDSA v1 and v2 implementations.
 */
export class BaseEddsaUtils extends baseTSSUtils<KeyShare> {
  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin, wallet?: IWallet) {
    super(bitgo, baseCoin, wallet);
    this.setBitgoGpgPubKey(bitgo);
  }
}
