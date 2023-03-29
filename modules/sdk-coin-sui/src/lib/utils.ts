import {
  BaseUtils,
  BuildTransactionError,
  ParseTransactionError,
  isValidEd25519PublicKey,
  InvalidParameterValueError,
  TransactionType,
  NotSupported,
} from '@bitgo/sdk-core';
import BigNumber from 'bignumber.js';
import { SUI_ADDRESS_LENGTH } from './constants';
import { bcs } from './bcs';
import { fromB64 } from '@mysten/bcs';
import {
  CallArg,
  ImmOrOwnedArg,
  MethodNames,
  ObjectArg,
  ObjVecArg,
  SharedObjectRef,
  SuiAddress,
  SuiObjectRef,
  SuiTransactionType,
} from './iface';
import { Buffer } from 'buffer';

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
      const deserialized = bcs.de('TransactionData', data);
      bcs.ser('TransactionData', deserialized);
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
    if (!address || !this.isValidAddress(address)) {
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
  isValidAmount(amount: number): boolean {
    const bigNumberAmount = new BigNumber(amount);
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
   * Map Shared object to CallArg
   *
   * @param {SharedObjectRef} obj
   * @return { Object: ObjectArg }
   *
   * example: { Object: { Shared: SUI_SYSTEM_STATE_OBJECT } };
   */
  mapSharedObjectToCallArg(obj: SharedObjectRef): CallArg {
    return { Object: { Shared: utils.normalizeObject(obj) } };
  }

  /**
   * Normalize ObjectId and version
   *
   * @param {SharedObjectRef} obj
   * @return {SharedObjectRef}
   */
  normalizeObject(obj: SharedObjectRef): SharedObjectRef {
    return {
      objectId: utils.normalizeHexId(obj.objectId),
      initialSharedVersion: Number(obj.initialSharedVersion),
      mutable: obj.mutable,
    };
  }

  /**
   * Map CallArg object to Shared
   *
   * @param {CallArg} callArg
   * @return {SharedObjectRef}
   */
  mapCallArgToSharedObject(callArg: CallArg): SharedObjectRef {
    return callArg['Object'].Shared;
  }

  /**
   * Map coins objects to CallArg
   *
   * @param {SuiObjectRef[]} coins
   * @return {CallArg}
   * example: { ObjVec: [{ ImmOrOwned: coin_to_stake }] }
   */
  mapCoinsToCallArg(coins: SuiObjectRef[]): CallArg {
    return {
      ObjVec: coins.map((coin) => {
        return { ImmOrOwned: coin };
      }),
    };
  }

  /**
   * Map CallArg object to Coins
   *
   * @param {ObjVecArg} callArg
   * @return {SuiObjectRef[]}
   */
  mapCallArgToCoins(callArg: ObjVecArg): SuiObjectRef[] {
    return Array.from(callArg.ObjVec).map((it: ObjectArg) => {
      return (it as ImmOrOwnedArg).ImmOrOwned;
    });
  }

  /**
   * Map SuiObjectRef object to CallArg
   *
   * @param {SuiObjectRef[]} coins
   * @return {CallArg}
   * example: { ObjVec: [{ ImmOrOwned: coin_to_stake }] }
   */
  mapSuiObjectRefToCallArg(suiObjectRef: SuiObjectRef): CallArg {
    return {
      Object: { ImmOrOwned: suiObjectRef },
    };
  }

  /**
   * Map CallArg object to SuiObjectRef
   *
   * @param {ObjVecArg} callArg
   * @return {SuiObjectRef}
   */
  mapCallArgToSuiObjectRef(callArg: CallArg): SuiObjectRef {
    return ((callArg as { Object: ObjectArg }).Object as ImmOrOwnedArg).ImmOrOwned;
  }

  /**
   * Map staking amount to CallArg
   *
   * @param {number} amount
   * @return {CallArg}
   * example: { Pure: bcs.ser('vector<u64>', [AMOUNT]).toBytes() };
   */
  mapAmountToCallArg(amount: number): CallArg {
    try {
      return {
        Pure: bcs.ser('vector<u64>', [String(amount)]).toBytes(),
      };
    } catch (e) {
      throw new BuildTransactionError('Failed to serialize amount to call argument');
    }
  }

  /**
   * Map CallArg to staking amount
   *
   * @param {CallArg} callArg
   * @return {number}
   * example: { Pure: bcs.ser('vector<u64>', [AMOUNT]).toBytes() };
   */
  mapCallArgToAmount(callArg: CallArg): number {
    try {
      if ('Pure' in callArg && callArg.Pure.length) {
        return Number(bcs.de('vector<u64>', Buffer.from(callArg.Pure).toString('base64'), 'base64'));
      } else {
        throw new InvalidParameterValueError('Not a valid amount CallArg');
      }
    } catch (e) {
      throw new BuildTransactionError('Failed to deserialize amount from call argument');
    }
  }

  /**
   * Map staking validator address to CallArg
   *
   * @param {SuiAddress} suiAddress
   * @return {CallArg}
   * example: { Pure: bcs.ser('address', VALIDATOR_ADDRESS).toBytes() };
   */
  mapAddressToCallArg(address: SuiAddress): CallArg {
    try {
      return {
        Pure: bcs.ser('address', address).toBytes(),
      };
    } catch (e) {
      throw new BuildTransactionError('Failed to serialize address to call argument');
    }
  }

  /**
   * Map CallArg to staking amount
   *
   * @param {CallArg} callArg
   * @return {string}
   * example: { Pure: bcs.ser('vector<u64>', [AMOUNT]).toBytes() };
   */
  mapCallArgToAddress(callArg: CallArg): string {
    try {
      if ('Pure' in callArg && callArg.Pure.length) {
        return String(bcs.de('address', Buffer.from(callArg.Pure).toString('base64'), 'base64'));
      } else {
        throw new InvalidParameterValueError('Not a valid address CallArg');
      }
    } catch (e) {
      throw new BuildTransactionError('Failed to deserialize address from call argument');
    }
  }

  /**
   * Get transaction type by function name
   *
   * @param {MethodNames} fctName
   * @return {TransactionType}
   */
  getTransactionType(fctName: string): TransactionType {
    switch (fctName) {
      case MethodNames.RequestAddDelegationMulCoin:
        return TransactionType.AddDelegator;
      case MethodNames.RequestWithdrawDelegation:
        return TransactionType.StakingWithdraw;
      case MethodNames.RequestSwitchDelegation:
        return TransactionType.StakingSwitch;
      default:
        throw new NotSupported(`Staking Transaction type with function ${fctName} not supported`);
    }
  }

  /**
   * Get SUI transaction type by function name
   *
   * @param {MethodNames} fctName
   * @return {SuiTransactionType}
   */
  getSuiTransactionType(fctName: string): SuiTransactionType {
    switch (fctName) {
      case MethodNames.RequestAddDelegationMulCoin:
        return SuiTransactionType.AddDelegation;
      case MethodNames.RequestWithdrawDelegation:
        return SuiTransactionType.WithdrawDelegation;
      case MethodNames.RequestSwitchDelegation:
        return SuiTransactionType.SwitchDelegation;
      default:
        throw new NotSupported(`Sui staking transaction type with function ${fctName} not supported`);
    }
  }
}

const utils = new Utils();

export default utils;
