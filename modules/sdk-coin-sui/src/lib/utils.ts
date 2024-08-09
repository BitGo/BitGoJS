import {
  BaseUtils,
  BuildTransactionError,
  InvalidTransactionError,
  isValidEd25519PublicKey,
  ParseTransactionError,
  Recipient,
  TransactionType,
} from '@bitgo/sdk-core';
import BigNumber from 'bignumber.js';
import { SUI_ADDRESS_LENGTH } from './constants';
import { isPureArg } from './mystenlab/types/sui-bcs';
import { BCS, fromB64 } from '@mysten/bcs';
import {
  MethodNames,
  RequestAddStake,
  StakingProgrammableTransaction,
  SuiObjectInfo,
  SuiProgrammableTransaction,
  SuiTransaction,
  SuiTransactionType,
} from './iface';
import { Buffer } from 'buffer';
import {
  isValidSuiAddress,
  normalizeSuiAddress,
  normalizeSuiObjectId,
  SUI_TYPE_ARG,
  SuiJsonValue,
  SuiObjectRef,
} from './mystenlab/types';
import {
  builder,
  MergeCoinsTransaction,
  MoveCallTransaction,
  ObjectCallArg,
  SplitCoinsTransaction,
  TransactionBlockInput,
  TransactionType as TransactionCommandType,
} from './mystenlab/builder';
import { SIGNATURE_SCHEME_TO_FLAG } from './keyPair';
import blake2b from '@bitgo/blake2b';
import { TRANSACTION_DATA_MAX_SIZE } from './mystenlab/builder/TransactionDataBlock';
import { makeRPC } from './rpcClient';
import assert from 'assert';

export function isImmOrOwnedObj(obj: ObjectCallArg['Object']): obj is { ImmOrOwned: SuiObjectRef } {
  return 'ImmOrOwned' in obj;
}

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
      builder.ser('TransactionData', deserialized, { maxSize: TRANSACTION_DATA_MAX_SIZE });
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
  getTransactionType(suiTransactionType: SuiTransactionType): TransactionType {
    switch (suiTransactionType) {
      case SuiTransactionType.Transfer:
      case SuiTransactionType.TokenTransfer:
        return TransactionType.Send;
      case SuiTransactionType.AddStake:
        return TransactionType.StakingAdd;
      case SuiTransactionType.WithdrawStake:
        return TransactionType.StakingWithdraw;
      case SuiTransactionType.CustomTx:
        return TransactionType.CustomTx;
    }
  }

  /**
   * Get SUI transaction type
   *
   * @param {MethodNames} fctName
   * @return {TransactionType}
   */
  getSuiTransactionType(command: TransactionCommandType): SuiTransactionType {
    switch (command.kind) {
      case 'SplitCoins':
        if ((command as SplitCoinsTransaction).coin.kind === 'GasCoin') {
          return SuiTransactionType.Transfer;
        }
        return SuiTransactionType.TokenTransfer;
      case 'TransferObjects':
        return SuiTransactionType.Transfer;
      case 'MergeCoins':
        if ((command as MergeCoinsTransaction).destination.kind === 'GasCoin') {
          return SuiTransactionType.Transfer;
        }
        return SuiTransactionType.TokenTransfer;
      case 'MoveCall':
        if (command.target.endsWith(MethodNames.RequestAddStake)) {
          return SuiTransactionType.AddStake;
        } else if (command.target.endsWith(MethodNames.RequestWithdrawStake)) {
          return SuiTransactionType.WithdrawStake;
        } else if (
          command.target.endsWith(MethodNames.StakingPoolSplit) ||
          command.target.endsWith(MethodNames.PublicTransfer)
        ) {
          return SuiTransactionType.CustomTx;
        } else {
          throw new InvalidTransactionError(`unsupported target method ${command.target}`);
        }
      default:
        throw new InvalidTransactionError(`unsupported transaction kind ${command.kind}`);
    }
  }

  getRecipients(tx: SuiTransaction<SuiProgrammableTransaction>): Recipient[] {
    const receipts: Recipient[] = [];
    const splitResults: number[] = [];
    tx.tx.transactions.forEach((transaction) => {
      if (transaction.kind === 'SplitCoins') {
        const index = transaction.amounts[0].index;
        const input = tx.tx.inputs[index] as any;
        splitResults.push(this.getAmount(input));
      }

      if (transaction.kind === 'MoveCall' && transaction.target.endsWith(MethodNames.StakingPoolSplit)) {
        const index = transaction.arguments[1].index;
        const input = tx.tx.inputs[index] as any;
        splitResults.push(this.getAmount(input));
      }
    });

    const destinations: string[] = [];
    tx.tx.transactions.forEach((transaction) => {
      if (transaction.kind === 'TransferObjects') {
        const index = transaction.address.index;
        const input = tx.tx.inputs[index] as any;
        destinations.push(this.getAddress(input));
      }
    });
    destinations.map((address, i) => {
      receipts.push({
        address: address,
        amount: splitResults[i].toString(),
      });
    });

    tx.tx.transactions.forEach((transaction) => {
      if (transaction.kind === 'MoveCall' && transaction.target.endsWith(MethodNames.PublicTransfer)) {
        const destinationArg = transaction.arguments[1];
        const destinationInput = tx.tx.inputs[destinationArg.index] as any;
        const destination = this.getAddress(destinationInput);

        const movingObject = transaction.arguments[0];
        if (movingObject.kind === 'Input') {
          receipts.push({
            address: destination,
            amount: '0', // set 0, not able to get amount merely from parsing
            data: 'unknown amount',
          });
        } else if (movingObject.kind === 'Result') {
          receipts.push({
            address: destination,
            amount: splitResults[movingObject.index].toString(),
          });
        }
      }
    });

    return receipts;
  }

  /**
   * Get add staking requests
   *
   * @param {StakingProgrammableTransaction} tx: staking transaction object
   * @return {RequestAddStake[]}  add staking requests
   */
  getStakeRequests(tx: StakingProgrammableTransaction): RequestAddStake[] {
    const amounts: number[] = [];
    const addresses: string[] = [];
    tx.transactions.forEach((transaction, i) => {
      if (transaction.kind === 'SplitCoins') {
        const amountInputIdx = ((transaction as SplitCoinsTransaction).amounts[0] as TransactionBlockInput).index;
        amounts.push(utils.getAmount(tx.inputs[amountInputIdx] as TransactionBlockInput));
      }
      if (transaction.kind === 'MoveCall') {
        const validatorAddressInputIdx = ((transaction as MoveCallTransaction).arguments[2] as TransactionBlockInput)
          .index;
        const validatorAddress = utils.getAddress(tx.inputs[validatorAddressInputIdx] as TransactionBlockInput);
        addresses.push(validatorAddress);
      }
    });
    return addresses.map((address, index) => {
      return {
        validatorAddress: address,
        amount: amounts[index],
      } as RequestAddStake;
    });
  }

  getAmount(input: SuiJsonValue | TransactionBlockInput): number {
    return isPureArg(input)
      ? builder.de(BCS.U64, Buffer.from(new Uint16Array(input.Pure)).toString('base64'), 'base64')
      : (input as TransactionBlockInput).value;
  }

  getAddress(input: TransactionBlockInput): string {
    if (input.hasOwnProperty('value')) {
      return isPureArg(input.value)
        ? normalizeSuiAddress(
            builder.de(BCS.ADDRESS, Buffer.from(new Uint16Array(input.value?.Pure)).toString('base64'), 'base64')
          )
        : (input as TransactionBlockInput).value;
    } else {
      return isPureArg(input)
        ? normalizeSuiAddress(
            builder.de(BCS.ADDRESS, Buffer.from(new Uint16Array(input.Pure)).toString('base64'), 'base64')
          )
        : (input as TransactionBlockInput).value;
    }
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

  transactionInput(type: 'object' | 'pure', index = 0, value?: unknown): TransactionBlockInput {
    return {
      kind: 'Input',
      value: typeof value === 'bigint' ? String(value) : value,
      index,
      type,
    };
  }

  getAddressFromPublicKey(publicKey: string): string {
    const PUBLIC_KEY_SIZE = 32;
    const tmp = new Uint8Array(PUBLIC_KEY_SIZE + 1);
    const pubBuf = Buffer.from(publicKey, 'hex');
    tmp.set([SIGNATURE_SCHEME_TO_FLAG['ED25519']]); // ED25519: 0x00,
    tmp.set(pubBuf, 1);
    return normalizeSuiAddress(
      blake2b(PUBLIC_KEY_SIZE)
        .update(tmp)
        .digest('hex')
        .slice(0, SUI_ADDRESS_LENGTH * 2)
    );
  }

  async getFeeEstimate(url: string, txHex: string): Promise<BigNumber> {
    const result = await makeRPC(url, 'sui_dryRunTransactionBlock', [txHex]);
    assert(result.effects);
    assert(result.effects.gasUsed);

    if (result.effects.status.status !== 'success') {
      console.error(`Dry run failed, could not automatically determine a budget for txHex ${txHex}`);
      throw new Error(`Failed to get fee estimate`);
    }

    const gasObject = result.effects.gasUsed;

    const storageCost = new BigNumber(gasObject.storageCost);
    const computationCost = new BigNumber(gasObject.computationCost);
    const storageRebate = new BigNumber(gasObject.storageRebate);
    const netCost = computationCost.plus(storageCost).minus(storageRebate);

    return netCost.comparedTo(computationCost) > 0 ? netCost : computationCost;
  }

  async getBalance(url: string, owner: string, coinType?: string): Promise<string> {
    if (coinType === undefined) {
      coinType = SUI_TYPE_ARG;
    }
    const result = await makeRPC(url, 'suix_getBalance', [owner, coinType]);
    return result.totalBalance;
  }

  async getInputCoins(url: string, owner: string, coinType?: string): Promise<SuiObjectInfo[]> {
    if (coinType === undefined) {
      coinType = SUI_TYPE_ARG;
    }
    let hasNextPage = true;
    let cursor = undefined;
    let params = [owner, coinType];
    let data = [];
    while (hasNextPage) {
      if (cursor !== undefined) {
        params = [owner, coinType, cursor];
      }
      try {
        const result = await makeRPC(url, 'suix_getCoins', params);
        data = data.concat(result.data);
        hasNextPage = result.hasNextPage;
        cursor = result.nextCursor;
      } catch (e) {
        console.error(`Failed to get input coins from the node ${e}`);
        throw new Error(`Failed to get input coins from the node.`);
      }
    }
    return data
      .filter((object: any) => object.balance !== undefined)
      .map((object: any) => {
        return {
          coinType: object.coinType,
          objectId: object.coinObjectId,
          version: object.version,
          digest: object.digest,
          balance: new BigNumber(object.balance),
        };
      });
  }

  async executeTransactionBlock(url: string, serializedTx: string, signatures: string[]): Promise<string> {
    const reqType = 'WaitForEffectsCert';
    const options = { showEffects: true };
    const params = [serializedTx, signatures, options, reqType];
    let result: Record<string, any>;
    try {
      result = await makeRPC(url, 'sui_executeTransactionBlock', params);
    } catch (e) {
      throw new Error(`${e.message}`);
    }
    return result.digest;
  }

  validateNonNegativeNumber(defaultVal: number, errorMsg: string, inputVal?: number): number {
    if (inputVal === undefined) {
      return defaultVal;
    }
    let nonNegativeNum: number;
    try {
      nonNegativeNum = Number(inputVal);
    } catch (e) {
      throw new Error(errorMsg);
    }
    if (isNaN(nonNegativeNum.valueOf()) || nonNegativeNum < 0) {
      throw new Error(errorMsg);
    }
    return nonNegativeNum;
  }
}

const utils = new Utils();
export default utils;

export enum AppId {
  Sui = 0,
}

export enum IntentVersion {
  V0 = 0,
}

export enum IntentScope {
  TransactionData = 0,
  TransactionEffects = 1,
  CheckpointSummary = 2,
  PersonalMessage = 3,
}

export type Intent = [IntentScope, IntentVersion, AppId];
