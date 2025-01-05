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
  isValidEd25519PublicKey,
  isValidEd25519SecretKey,
  ParseTransactionError,
  TransactionRecipient,
} from '@bitgo/sdk-core';
import { APT_ADDRESS_LENGTH, APT_BLOCK_ID_LENGTH, APT_SIGNATURE_LENGTH, APT_TRANSACTION_ID_LENGTH } from './constants';
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

  getRecipientFromTransactionPayload(payload: TransactionPayload): TransactionRecipient {
    let address = 'INVALID',
      amount = '0';
    if (payload instanceof TransactionPayloadEntryFunction) {
      const entryFunction = payload.entryFunction;
      address = entryFunction.args[0].toString();
      const amountBuffer = Buffer.from(entryFunction.args[1].bcsToBytes());
      amount = amountBuffer.readBigUint64LE().toString();
    }
    return { address, amount };
  }

  isValidRawTransaction(rawTransaction: string): boolean {
    try {
      const signedTxn = this.deserializeSignedTransaction(rawTransaction);
      const rawTxn = signedTxn.raw_txn;
      const senderAddress = rawTxn.sender.toString();
      const recipient = utils.getRecipientFromTransactionPayload(rawTxn.payload);
      const recipientAddress = recipient.address;
      const recipientAmount = new BigNumber(recipient.amount);
      return (
        this.isValidAddress(senderAddress) && this.isValidAddress(recipientAddress) && !recipientAmount.isLessThan(0)
      );
    } catch (e) {
      console.error('invalid raw transaction', e);
      return false;
    }
  }

  validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction) {
      throw new ParseTransactionError('Invalid raw transaction: Undefined');
    }
    if (!this.isValidRawTransaction(rawTransaction)) {
      throw new ParseTransactionError('Invalid raw transaction');
    }
  }

  deserializeSignedTransaction(rawTransaction: string): SignedTransaction {
    const txnBytes = Hex.fromHexString(rawTransaction).toUint8Array();
    const deserializer = new Deserializer(txnBytes);
    return deserializer.deserialize(SignedTransaction);
  }

  getPublicKeyBufferFromHexString(publicKey: string): Buffer {
    return Buffer.from(Hex.fromHexString(publicKey).toUint8Array());
  }

  castToNumber(value: bigint): number {
    return new BigNumber(value.toString()).toNumber();
  }
}

const utils = new Utils();

export default utils;
