import {
  BaseUtils,
  BuildTransactionError,
  ParseTransactionError,
  isValidEd25519PublicKey,
  TransactionType,
  NotSupported,
  Recipient,
} from '@bitgo/sdk-core';
import BigNumber from 'bignumber.js';
import { SUI_ADDRESS_LENGTH } from './constants';
import { isPureArg } from './mystenlab/types/sui-bcs';
import { BCS, fromB64 } from '@mysten/bcs';
import { MethodNames } from './iface';
import { Buffer } from 'buffer';
import {
  isValidSuiAddress,
  normalizeSuiAddress,
  normalizeSuiObjectId,
  SuiJsonValue,
  SuiObjectRef,
} from './mystenlab/types';
import { builder, TransactionInput } from './mystenlab/builder';

export class Utils implements BaseUtils {
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
   * Checks if raw transaction can be deserialized
   *
   * @param {string} rawTransaction - transaction in base64 string format
   * @returns {boolean} - the validation result
   */
  isValidRawTransaction(rawTransaction: string): boolean {
    try {
      const data = fromB64(rawTransaction);
      const deserialized = builder.de('TransactionData', data);
      builder.ser('TransactionData', deserialized);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   *
   * @param {string} rawTransaction - Transaction in base64 string  format
   */
  validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction) {
      throw new ParseTransactionError('Invalid raw transaction: Undefined');
    }
    if (!this.isValidRawTransaction(rawTransaction)) {
      throw new ParseTransactionError('Invalid raw transaction');
    }
  }

  /**
   * Validates addresses to check if all exist and are valid Sui public keys
   *
   * @param {string} addresses The address to be validated
   * @param {string} fieldName Name of the field to validate, its needed to return which field is failing on case of error.
   */
  validateAddresses(addresses: string[], fieldName: string): void {
    for (const address of addresses) {
      this.validateAddress(address, fieldName);
    }
  }

  /**
   * Validates address to check if it exists and is a valid Sui public key
   *
   * @param {string} address The address to be validated
   * @param {string} fieldName Name of the field to validate, its needed to return which field is failing on case of error.
   */
  validateAddress(address: string, fieldName: string): void {
    if (!address || !isValidSuiAddress(normalizeSuiAddress(address))) {
      throw new BuildTransactionError(`Invalid or missing ${fieldName}, got: ${address}`);
    }
  }

  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    return this.isHex(address) && this.getHexByteLength(address) === SUI_ADDRESS_LENGTH;
  }

  isHex(value: string): boolean {
    return /^(0x|0X)?[a-fA-F0-9]+$/.test(value) && value.length % 2 === 0;
  }

  getHexByteLength(value: string): number {
    // return /^(0x|0X)/.test(value) ? (value.length - 2) / 2 : value.length / 2;
    return /^(0x|0X)/.test(value) ? (value.length - 2) / 2 : value.length / 2;
  }

  /**
   * Returns whether or not the string is a valid amount
   *
   * @param {number[]} amounts - the amounts to validate
   * @returns {boolean} - the validation result
   */
  isValidAmounts(amounts: number[]): boolean {
    for (const amount of amounts) {
      if (!this.isValidAmount(amount)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns whether or not the string is a valid amount
   *
   * @param {number} amounts - the amount to validate
   * @returns {boolean} - the validation result
   */
  isValidAmount(amount: string | number): boolean {
    const bigNumberAmount = new BigNumber(Number(amount));
    if (!bigNumberAmount.isInteger() || bigNumberAmount.isLessThanOrEqualTo(0)) {
      return false;
    }
    return true;
  }

  /**
   * Normalizes hex ids (addresses, object ids) to always contain the '0x' prefix.
   *
   * @param {string} id
   * @return {string}
   **/
  normalizeHexId(id: string): string {
    return id.startsWith('0x') ? id : '0x'.concat(id);
  }

  /**
   * Get transaction type by function name
   *
   * @param {MethodNames} fctName
   * @return {TransactionType}
   */
  getTransactionType(fctName: string): TransactionType {
    switch (fctName) {
      case MethodNames.RequestAddStakeMulCoin:
        return TransactionType.StakingAdd;
      case MethodNames.RequestWithdrawStake:
        return TransactionType.StakingWithdraw;
      default:
        throw new NotSupported(`Staking Transaction type with function ${fctName} not supported`);
    }
  }

  getRecipients(inputs: SuiJsonValue[] | TransactionInput[]): Recipient[] {
    const amounts: string[] = [];
    const addresses: string[] = [];
    inputs.forEach((input, index) => {
      if (index % 2 === 0) {
        amounts.push(this.getRecipientAmount(input));
      } else {
        addresses.push(this.getRecipientAddress(input));
      }
    });
    return addresses.map((address, index) => {
      return {
        address: address,
        amount: Number(amounts[index]).toString(),
      } as Recipient;
    });
  }

  getRecipientAmount(input: SuiJsonValue | TransactionInput): string {
    return isPureArg(input)
      ? builder.de(BCS.U64, Buffer.from(input.Pure).toString('base64'), 'base64')
      : (input as TransactionInput).value;
  }

  getRecipientAddress(input: SuiJsonValue | TransactionInput): string {
    return isPureArg(input)
      ? normalizeSuiAddress(builder.de(BCS.ADDRESS, Buffer.from(input.Pure).toString('base64'), 'base64'))
      : (input as TransactionInput).value;
  }

  normalizeCoins(coins: any[]): SuiObjectRef[] {
    return coins.map((coin) => {
      return utils.normalizeSuiObjectRef(coin);
    });
  }

  normalizeSuiObjectRef(obj: SuiObjectRef): SuiObjectRef {
    return {
      objectId: normalizeSuiObjectId(obj.objectId),
      version: Number(obj.version),
      digest: obj.digest,
    };
  }

  transactionInput(type: 'object' | 'pure', index = 0, value?: unknown): TransactionInput {
    return {
      kind: 'Input',
      value: typeof value === 'bigint' ? String(value) : value,
      index,
      type,
    };
  }
}

const utils = new Utils();
export default utils;
