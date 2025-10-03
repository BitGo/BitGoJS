import { BaseUtils, isValidEd25519PublicKey } from '@bitgo/sdk-core';
import { decodePreparedTransaction, PreparedTransaction, TopologyController } from '@canton-network/wallet-sdk';

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

  /**
   * Method to parse raw canton transaction & get required data
   * @param {String} rawData base64 encoded string
   * @returns
   */
  parseRawCantonTransactionData(rawData: string): PreparedTransaction {
    const decodedData = decodePreparedTransaction(rawData);
    // const sender = decodedData.metadata?.submitterInfo?.actAs?.[0];
    return decodedData;
  }
}

const utils = new Utils();

export default utils;
