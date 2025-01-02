import {
  AuthenticationKey,
  Deserializer,
  Ed25519PublicKey,
  Hex,
  RawTransaction,
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

  getRecipientFromTransactionPayload(payload: TransactionPayload): TransactionRecipient {
    let address = 'INVALID',
      amount = '0';
    if (payload instanceof TransactionPayloadEntryFunction) {
      const entryFunction = payload.entryFunction;
      address = entryFunction.args[0].toString();
      amount = entryFunction.args[1].toString();
    }
    return { address, amount };
  }

  isValidRawTransaction(rawTransaction: string): boolean {
    try {
      const rawTxn = this.deserializeRawTransaction(rawTransaction);
      const senderAddress = rawTxn.sender.toString();
      const trnRecipient = utils.getRecipientFromTransactionPayload(rawTxn.payload);
      const recipientAddress = trnRecipient.address;
      const recipientAmount = new BigNumber(trnRecipient.amount);
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

  deserializeRawTransaction(rawTransaction: string): RawTransaction {
    const signedTxn = this.deserializeSignedTransaction(rawTransaction);
    return signedTxn.raw_txn;
  }

  deserializeSignedTransaction(rawTransaction: string): SignedTransaction {
    const txnBytes = Hex.fromHexString(rawTransaction).toUint8Array();
    const deserializer = new Deserializer(txnBytes);
    return deserializer.deserialize(SignedTransaction);
  }
}

const utils = new Utils();

export default utils;
