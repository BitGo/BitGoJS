import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { InvalidTransactionError } from '@bitgo/sdk-core';
import { TransferBuilder } from './transferBuilder';
import { MEMO_HEX_REGEX } from './constants';
import utils from './utils';

/**
 * Builds a POLYX transferWithMemo transaction using the NEW Polymesh memo encoding:
 * UTF-8 bytes right-padded with 0x00 to 32 bytes, passed as a 0x-prefixed hex string.
 *
 * OLD encoding (TransferBuilder): plain string, left-padded with ASCII '0' to 32 chars.
 * NEW encoding (this class):      0x-prefixed hex, right-padded with 0x00 to 32 bytes.
 *
 * Same intended memo produces different on-chain bytes depending on which builder is used.
 * Use this builder when the recipient or downstream tooling expects Polymesh-native encoding.
 *
 * [CLEANUP-V8-OLD] v7 metadata. Kept for Flipt rollback alongside V8HexTransferBuilder.
 */
export class HexTransferBuilder extends TransferBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Encode memo using the NEW Polymesh format.
   *
   * If the value is already a 0x-prefixed 32-byte hex string (e.g. when decoding an
   * existing NEW-encoded transaction via fromImplementation), it is stored as-is.
   * Otherwise the text is converted to UTF-8 hex and right-padded with 0x00 to 32 bytes.
   *
   * @param memo The intended memo string (e.g. "56594", "testmemo")
   */
  memo(memo: string): this {
    if (memo.startsWith('0x') && memo.length === 66) {
      if (!MEMO_HEX_REGEX.test(memo)) {
        throw new InvalidTransactionError(`Invalid memo hex encoding: ${memo}`);
      }
      // already a fully-encoded 32-byte hex memo — store as-is (round-trip from fromImplementation)
      this._memo = memo;
    } else {
      this._memo = utils.encodeMemoNew(memo);
    }
    return this;
  }
}
