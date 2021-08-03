import { RippleAPI } from 'ripple-lib';
import * as RippleAddressCodec from 'ripple-address-codec';
import { BaseUtils } from '../baseCoin';
import { NotImplementedError } from '../baseCoin/errors';

export const initApi = (): RippleAPI => new RippleAPI({});
export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    if (RippleAddressCodec.isValidClassicAddress(address) || RippleAddressCodec.isValidXAddress(address)) {
      return true;
    }
    return false;
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    throw new NotImplementedError('method not implemented');
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    throw new NotImplementedError('method not implemented');
  }

  /** @inheritdoc */
  isValidPublicKey(key: string): boolean {
    throw new NotImplementedError('method not implemented');
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new NotImplementedError('method not implemented');
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    throw new NotImplementedError('method not implemented');
  }
}

export default new Utils();
