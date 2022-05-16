import { BaseUtils } from '@bitgo/sdk-core/src/account-lib/baseCoin';
import { NotImplementedError } from '@bitgo/sdk-core/src/account-lib/baseCoin/errors';

export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    throw new NotImplementedError('isValidAddress not implemented');
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    throw new NotImplementedError('isValidBlockId not implemented');
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    throw new NotImplementedError('isValidPrivateKey not implemented');
  }

  /** @inheritdoc */
  isValidPublicKey(key: string): boolean {
    throw new NotImplementedError('isValidPublicKey not implemented');
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new NotImplementedError('isValidSignature not implemented');
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    throw new NotImplementedError('isValidTransactionId not implemented');
  }
}
