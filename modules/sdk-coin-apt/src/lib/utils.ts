import { AuthenticationKey, Ed25519PublicKey } from '@aptos-labs/ts-sdk';
import { BaseUtils, isValidEd25519PublicKey, isValidEd25519SecretKey } from '@bitgo/sdk-core';
import { APT_ADDRESS_LENGTH, APT_BLOCK_ID_LENGTH, APT_SIGNATURE_LENGTH, APT_TRANSACTION_ID_LENGTH } from './constants';

export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    return this.isValidHex(address, APT_ADDRESS_LENGTH);
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    return this.isValidHex(hash, APT_BLOCK_ID_LENGTH);
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
    return this.isValidHex(signature, APT_SIGNATURE_LENGTH);
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    return this.isValidHex(txId, APT_TRANSACTION_ID_LENGTH);
  }

  isValidHex(value: string, length: number) {
    const regex = new RegExp(`^(0x|0X)[a-fA-F0-9]{${length}}$`);
    return regex.test(value);
  }

  getAddressFromPublicKey(publicKey: string): string {
    const aptosPublicKey = new Ed25519PublicKey(Buffer.from(publicKey, 'hex'));
    const authKey = AuthenticationKey.fromPublicKey({ publicKey: aptosPublicKey });
    const accountAddress = authKey.derivedAddress();
    return accountAddress.toString();
  }
}

const utils = new Utils();

export default utils;
