import { BaseUtils } from '@bitgo/sdk-core';

export class Utils implements BaseUtils {
  isValidAddress(address: string): boolean {
    throw new Error('Method not implemented');
  }

  isValidBlockId(hash: string): boolean {
    throw new Error('Method not implemented');
  }

  isValidPrivateKey(key: string): boolean {
    throw new Error('Method not implemented');
  }

  isValidPublicKey(key: string): boolean {
    throw new Error('Method not implemented');
  }

  isValidSignature(signature: string): boolean {
    throw new Error('Method not implemented');
  }

  isValidTransactionId(txId: string): boolean {
    throw new Error('Method not implemented');
  }
}

const utils = new Utils();

export default utils;
