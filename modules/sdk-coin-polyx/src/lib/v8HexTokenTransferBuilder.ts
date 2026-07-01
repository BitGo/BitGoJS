import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { InvalidTransactionError } from '@bitgo/sdk-core';
import { V8TokenTransferBuilder } from './v8TokenTransferBuilder';
import { MEMO_HEX_REGEX } from './constants';
import utils from './utils';

/**
 * Builds a Polymesh settlement.addAndAffirmWithMediators transaction using the NEW
 * (hex) memo encoding against Polymesh v8 chain metadata, with AssetHolder-wrapped
 * legs/holderSet (see V8TokenTransferBuilder). Identical to V8TokenTransferBuilder;
 * only the memo encoding differs.
 */
export class V8HexTokenTransferBuilder extends V8TokenTransferBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Encode memo using the NEW Polymesh format.
   *
   * If the value is already a 0x-prefixed 32-byte hex string (e.g. when decoding an
   * existing NEW-encoded transaction via fromImplementation), it is stored as-is.
   * Otherwise the text is converted to UTF-8 hex and right-padded with 0x00 to 32 bytes.
   */
  memo(memo: string): this {
    if (memo.startsWith('0x') && memo.length === 66) {
      if (!MEMO_HEX_REGEX.test(memo)) {
        throw new InvalidTransactionError(`Invalid memo hex encoding: ${memo}`);
      }
      this._memo = memo;
    } else {
      this._memo = utils.encodeMemoNew(memo);
    }
    return this;
  }
}
