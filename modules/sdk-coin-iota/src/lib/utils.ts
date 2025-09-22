import { BaseUtils, isValidEd25519PublicKey, isValidEd25519SecretKey } from '@bitgo-beta/sdk-core';
import {
  IOTA_ADDRESS_LENGTH,
  IOTA_BLOCK_ID_LENGTH,
  IOTA_SIGNATURE_LENGTH,
  IOTA_TRANSACTION_ID_LENGTH,
} from './constants';
import { Ed25519PublicKey } from '@iota/iota-sdk/keypairs/ed25519';

export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    return this.isValidHex(address, IOTA_ADDRESS_LENGTH);
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    return this.isValidHex(hash, IOTA_BLOCK_ID_LENGTH);
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
    return this.isValidHex(signature, IOTA_SIGNATURE_LENGTH);
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    return this.isValidHex(txId, IOTA_TRANSACTION_ID_LENGTH);
  }

  isValidHex(value: string, length: number): boolean {
    const regex = new RegExp(`^(0x|0X)[a-fA-F0-9]{${length}}$`);
    return regex.test(value);
  }

  getAddressFromPublicKey(publicKey: string): string {
    const iotaPublicKey = new Ed25519PublicKey(Buffer.from(publicKey, 'hex'));
    return iotaPublicKey.toIotaAddress();
  }
}

const utils = new Utils();

export default utils;
