import {
  AccountAddress,
  AuthenticationKey,
  Deserializer,
  Ed25519PublicKey,
  EntryFunctionArgument,
  Hex,
  SignedTransaction,
  TransactionPayload,
  TransactionPayloadEntryFunction,
  U64,
} from '@aptos-labs/ts-sdk';
import {
  BaseUtils,
  InvalidTransactionError,
  isValidEd25519PublicKey,
  isValidEd25519SecretKey,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import {
  APT_ADDRESS_LENGTH,
  APT_BLOCK_ID_LENGTH,
  APT_SIGNATURE_LENGTH,
  APT_TRANSACTION_ID_LENGTH,
  COIN_BATCH_TRANSFER_FUNCTION,
  COIN_TRANSFER_FUNCTION,
  DIGITAL_ASSET_TRANSFER_FUNCTION,
  FUNGIBLE_ASSET_TRANSFER_FUNCTION,
  SECONDS_PER_WEEK,
  ADDRESS_BYTES_LENGTH,
  AMOUNT_BYTES_LENGTH,
  FUNGIBLE_ASSET_BATCH_TRANSFER_FUNCTION,
} from './constants';
import BigNumber from 'bignumber.js';
import { RecipientsValidationResult } from './iface';

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
    const moduleAddress = entryFunction.module_name.address.toString();
    const moduleIdentifier = entryFunction.module_name.name.identifier;
    const functionIdentifier = entryFunction.function_name.identifier;
    const uniqueIdentifier = `${moduleAddress}::${moduleIdentifier}::${functionIdentifier}`;
    switch (uniqueIdentifier) {
      case COIN_TRANSFER_FUNCTION:
      case COIN_BATCH_TRANSFER_FUNCTION:
        return TransactionType.Send;
      case FUNGIBLE_ASSET_TRANSFER_FUNCTION:
      case FUNGIBLE_ASSET_BATCH_TRANSFER_FUNCTION:
        return TransactionType.SendToken;
      case DIGITAL_ASSET_TRANSFER_FUNCTION:
        return TransactionType.SendNFT;
      default:
        throw new InvalidTransactionError(`Invalid transaction: unable to fetch transaction type ${moduleIdentifier}`);
    }
  }

  fetchAndValidateRecipients(
    addressArg: EntryFunctionArgument,
    amountArg: EntryFunctionArgument
  ): RecipientsValidationResult {
    const addressBytes = addressArg.bcsToBytes();
    const amountBytes = amountArg.bcsToBytes();
    let deserializedAddresses: string[];
    let deserializedAmounts: Uint8Array<ArrayBuffer>[];
    if (addressBytes.length > ADDRESS_BYTES_LENGTH || amountBytes.length > AMOUNT_BYTES_LENGTH) {
      deserializedAddresses = utils.deserializeAccountAddressVector(addressBytes);
      deserializedAmounts = utils.deserializeU64Vector(amountBytes);
      if (deserializedAddresses.length !== deserializedAmounts.length) {
        console.error('invalid payload entry function arguments : addresses and amounts length mismatch');
        return { recipients: { deserializedAddresses: [], deserializedAmounts: [] }, isValid: false };
      }
    } else {
      deserializedAddresses = [addressArg.toString()];
      deserializedAmounts = [amountBytes];
    }
    const allAddressesValid = deserializedAddresses.every((address) => utils.isValidAddress(address.toString()));
    const allAmountsValid = deserializedAmounts.every((amount) =>
      new BigNumber(utils.getAmountFromPayloadArgs(amount)).isGreaterThan(0)
    );
    return {
      recipients: { deserializedAddresses, deserializedAmounts },
      isValid: allAddressesValid && allAmountsValid,
    };
  }

  parseRecipients(addressArg: EntryFunctionArgument, amountArg: EntryFunctionArgument): TransactionRecipient[] {
    const { recipients, isValid } = utils.fetchAndValidateRecipients(addressArg, amountArg);
    if (!isValid) {
      throw new InvalidTransactionError('Invalid transaction recipients');
    }
    return recipients.deserializedAddresses.map((address, index) => ({
      address,
      amount: utils.getAmountFromPayloadArgs(recipients.deserializedAmounts[index]),
    })) as TransactionRecipient[];
  }

  deserializeSignedTransaction(rawTransaction: string): SignedTransaction {
    const txnBytes = Hex.fromHexString(rawTransaction).toUint8Array();
    const deserializer = new Deserializer(txnBytes);
    return deserializer.deserialize(SignedTransaction);
  }

  deserializeAccountAddressVector(serializedBytes: Uint8Array): string[] {
    const deserializer = new Deserializer(serializedBytes);
    const deserializedAddresses = deserializer.deserializeVector(AccountAddress);
    return deserializedAddresses.map((address) => address.toString());
  }

  deserializeU64Vector(serializedBytes: Uint8Array): Uint8Array[] {
    const deserializer = new Deserializer(serializedBytes);
    const deserializedAmounts = deserializer.deserializeVector(U64);
    return deserializedAmounts.map((amount) => amount.bcsToBytes());
  }

  getBufferFromHexString(hexString: string): Buffer {
    return Buffer.from(Hex.fromHexString(hexString).toUint8Array());
  }

  castToNumber(value: bigint): number {
    return new BigNumber(value.toString()).toNumber();
  }

  /**
   * Strip hex prefix
   * @param str
   * @returns hex string without 0x prefix
   */
  stripHexPrefix(str: string): string {
    return str.replace(/^0x/i, '');
  }

  getAmountFromPayloadArgs(amountArg: Uint8Array): string {
    const amountBuffer = Buffer.from(amountArg);
    const low = BigInt(amountBuffer.readUint32LE());
    const high = BigInt(amountBuffer.readUint32LE(4));
    const amount = (high << BigInt(32)) + low;
    return amount.toString();
  }

  /**
   * Returns the Aptos transaction expiration timestamp in seconds.
   * It is set to 1 week from now.
   */
  getTxnExpirationTimestamp(): number {
    return Math.floor(Date.now() / 1e3) + SECONDS_PER_WEEK;
  }
}

const utils = new Utils();

export default utils;
