import { BaseUtils, isValidEd25519PublicKey, isValidEd25519SecretKey, isBase58 } from '@bitgo/sdk-core';
import {
  IOTA_ADDRESS_LENGTH,
  IOTA_BLOCK_DIGEST_LENGTH,
  IOTA_SIGNATURE_LENGTH,
  IOTA_TRANSACTION_DIGEST_LENGTH,
} from './constants';
import { Ed25519PublicKey } from '@iota/iota-sdk/keypairs/ed25519';
import { Transaction as IotaTransaction } from '@iota/iota-sdk/transactions';
import { fromBase64 } from '@iota/bcs';

export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    return this.isValidHex(address, IOTA_ADDRESS_LENGTH);
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    return isBase58(hash, IOTA_BLOCK_DIGEST_LENGTH);
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    return isValidEd25519SecretKey(key);
  }

  /** @inheritdoc */
  isValidPublicKey(key: string): boolean {
    return isValidEd25519PublicKey(key);
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    try {
      return fromBase64(signature).length === IOTA_SIGNATURE_LENGTH;
    } catch (e) {
      return false;
    }
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    return isBase58(txId, IOTA_TRANSACTION_DIGEST_LENGTH);
  }

  isValidHex(value: string, length: number): boolean {
    const regex = new RegExp(`^(0x|0X)[a-fA-F0-9]{${length}}$`);
    return regex.test(value);
  }

  getAddressFromPublicKey(publicKey: string): string {
    const iotaPublicKey = new Ed25519PublicKey(Buffer.from(publicKey, 'hex'));
    return iotaPublicKey.toIotaAddress();
  }

  isValidRawTransaction(rawTransaction: string | Uint8Array): boolean {
    try {
      IotaTransaction.from(rawTransaction);
    } catch (e) {
      return false;
    }
    return true;
  }
}

const utils = new Utils();

export default utils;
