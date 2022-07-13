import { BaseUtils } from '@bitgo/sdk-core';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import { KeyPair } from './keyPair';

export class Utils implements BaseUtils {
  validateBlake2b(hash: string): boolean {
    if (hash.length !== 64) {
      return false;
    }
    return hash.match(/^[a-zA-Z0-9]+$/) !== null;
  }

  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    try {
      CardanoWasm.Address.from_bech32(address);
      return true;
    } catch (err) {
      return false;
    }
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    return this.validateBlake2b(hash);
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    // this will return true for both extended and non-extended ED25519 keys
    return this.isValidKey(key);
  }

  isValidKey(key: string): boolean {
    try {
      new KeyPair({ prv: key });
      return true;
    } catch {
      return false;
    }
  }

  /** @inheritdoc */
  isValidPublicKey(pubKey: string): boolean {
    try {
      new KeyPair({ pub: pubKey });
      return true;
    } catch {
      return false;
    }
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    try {
      CardanoWasm.Ed25519Signature.from_hex(signature);
      return true;
    } catch (err) {
      return false;
    }
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    return this.validateBlake2b(txId);
  }
}

const utils = new Utils();

export default utils;
