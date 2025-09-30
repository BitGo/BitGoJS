import { BaseUtils, isValidEd25519PublicKey } from '@bitgo/sdk-core';
import { TopologyController } from '@canton-network/wallet-sdk';

export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidPublicKey(key: string): boolean {
    return isValidEd25519PublicKey(key);
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    throw new Error('Method not implemented.');
  }

  /**
   * Method to create fingerprint (part of the canton partyId) from public key
   * @param {String} publicKey the public key
   * @returns {String}
   */
  getAddressFromPublicKey(publicKey: string): string {
    return TopologyController.createFingerprintFromPublicKey(publicKey);
  }
}

const utils = new Utils();

export default utils;
