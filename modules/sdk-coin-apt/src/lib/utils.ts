import {
  AuthenticationKey,
  Deserializer,
  Ed25519PublicKey,
  Hex,
  SignedTransaction,
  TransactionPayload,
  TransactionPayloadEntryFunction,
} from '@aptos-labs/ts-sdk';
import {
  BaseUtils,
  InvalidTransactionError,
  isValidEd25519PublicKey,
  isValidEd25519SecretKey,
  TransactionType,
} from '@bitgo/sdk-core';
import {
  APT_ADDRESS_LENGTH,
  APT_BLOCK_ID_LENGTH,
  APT_SIGNATURE_LENGTH,
  APT_TRANSACTION_ID_LENGTH,
  APTOS_ACCOUNT_MODULE,
  FUNGIBLE_ASSET_MODULE,
} from './constants';
import BigNumber from 'bignumber.js';

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

  isValidHex(value: string, length: number): boolean {
    const regex = new RegExp(`^(0x|0X)[a-fA-F0-9]{${length}}$`);
    return regex.test(value);
  }

  getAddressFromPublicKey(publicKey: string): string {
    const aptosPublicKey = new Ed25519PublicKey(Buffer.from(publicKey, 'hex'));
    const authKey = AuthenticationKey.fromPublicKey({ publicKey: aptosPublicKey });
    const accountAddress = authKey.derivedAddress();
    return accountAddress.toString();
  }

  getTransactionTypeFromTransactionPayload(payload: TransactionPayload): TransactionType {
    if (!(payload instanceof TransactionPayloadEntryFunction)) {
      throw new Error('Invalid Payload: Expected TransactionPayloadEntryFunction');
    }
    const entryFunction = payload.entryFunction;
    const moduleIdentifier = entryFunction.module_name.name.identifier.trim();
    switch (moduleIdentifier) {
      case APTOS_ACCOUNT_MODULE:
        return TransactionType.Send;
      case FUNGIBLE_ASSET_MODULE:
        return TransactionType.SendToken;
      default:
        throw new InvalidTransactionError(`Invalid transaction: unable to fetch transaction type ${moduleIdentifier}`);
    }
  }

  deserializeSignedTransaction(rawTransaction: string): SignedTransaction {
    const txnBytes = Hex.fromHexString(rawTransaction).toUint8Array();
    const deserializer = new Deserializer(txnBytes);
    return deserializer.deserialize(SignedTransaction);
  }

  getBufferFromHexString(hexString: string): Buffer {
    return Buffer.from(Hex.fromHexString(hexString).toUint8Array());
  }

  castToNumber(value: bigint): number {
    return new BigNumber(value.toString()).toNumber();
  }
}

const utils = new Utils();

export default utils;
