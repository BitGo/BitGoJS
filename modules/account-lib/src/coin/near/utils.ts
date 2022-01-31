import { BaseUtils } from '../baseCoin';
import { KeyPair } from './keyPair';
import bs58 from 'bs58';

export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    return this.isValidPublicKey(address);
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    return this.isBase58(hash, 32);
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    try {
      new KeyPair({ prv: key });
      return true;
    } catch {
      return false;
    }
  }

  /** @inheritdoc */
  isValidPublicKey(key: string): boolean {
    try {
      new KeyPair({ pub: key });
      return true;
    } catch {
      return false;
    }
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    return this.isBase58(signature, 64);
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    return this.isBase58(txId, 32);
  }

  isBase58(value: string, length: number): boolean {
    try {
      return !!value && bs58.decode(value).length === length;
    } catch (e) {
      return false;
    }
  }
}

const utils = new Utils();

export default utils;
