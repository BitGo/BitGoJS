import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { CLValue, PublicKey } from 'casper-client-sdk';
import { BuildTransactionError, InvalidParameterValueError, SigningError } from '../baseCoin/errors';
import { BaseKey } from '../baseCoin/iface';
import { TransactionType, StakingOperationTypes } from '../baseCoin';
import { TransactionBuilder, DEFAULT_M } from './transactionBuilder';
import { Transaction } from './transaction';
import {
  SECP256K1_PREFIX,
  TRANSACTION_TYPE,
  DELEGATE_VALIDATOR,
  DELEGATE_FROM_ADDRESS,
  STAKING_TYPE,
} from './constants';
import { isValidAmount, isValidAddress, getTransferAmount, getDelegatorAddress, getValidatorAddress } from './utils';

export class DelegateBuilder extends TransactionBuilder {
  private _validator: string;
  private _delegator: string;
  private _action: string;
  private _amount: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._action = 'delegate';
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const extraArguments = new Map<string, CLValue>();
    if (this._delegator && this._validator) {
      extraArguments.set(TRANSACTION_TYPE, CLValue.string(TransactionType[TransactionType.StakingLock]));
      extraArguments.set(STAKING_TYPE, CLValue.string(StakingOperationTypes[StakingOperationTypes.LOCK]));
      // TODO(STLX-1691): We are send the destination address as string until impediment STLX-1691 is fixed.
      // After that we will change this to send an instance of PublicKey instead.
      extraArguments.set(DELEGATE_FROM_ADDRESS, CLValue.string(this._delegator));
      extraArguments.set(DELEGATE_VALIDATOR, CLValue.string(this._validator));
    }
    this._session = {
      action: this._action,
      delegator: PublicKey.fromHex(SECP256K1_PREFIX + this._delegator),
      validator: PublicKey.fromHex(SECP256K1_PREFIX + this._validator),
      amount: this._amount,
      extraArguments: extraArguments,
    };
    this.transaction.setTransactionType(TransactionType.StakingLock);
    return await super.buildImplementation();
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.transaction.setTransactionType(TransactionType.StakingLock);
    this.validator(getValidatorAddress(tx.casperTx.session));
    this.delegator(getDelegatorAddress(tx.casperTx.session));
    this.amount(getTransferAmount(tx.casperTx.session));
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    if (this._multiSignerKeyPairs.length >= DEFAULT_M) {
      throw new SigningError('A maximum of ' + DEFAULT_M + ' can sign the transaction.');
    }
    return super.signImplementation(key);
  }

  //region Transfer fields
  /**
   * Set the destination address where the funds will be sent,
   *
   * @param {string} address the address to transfer funds to
   * @returns {DelegateBuilder} the builder with the new parameter set
   */
  validator(address: string): this {
    if (!isValidAddress(address)) {
      throw new InvalidParameterValueError('Invalid address');
    }
    this._validator = address;
    return this;
  }

  /**
   * Set the destination address where the funds will be sent,
   *
   * @param {string} address the address to transfer funds to
   * @returns {DelegateBuilder} the builder with the new parameter set
   */
  delegator(address: string): this {
    if (!isValidAddress(address)) {
      throw new InvalidParameterValueError('Invalid address');
    }
    this._delegator = address;
    return this;
  }

  /**
   * Set the amount to be transferred
   *
   * @param {string} amount amount to transfer
   * @returns {DelegateBuilder} the builder with the new parameter set
   */
  amount(amount: string): this {
    if (!isValidAmount(amount)) {
      throw new InvalidParameterValueError('Invalid amount');
    }
    this._amount = amount;
    return this;
  }

  //endregion

  //region Validators
  validateMandatoryFields(): void {
    if (!this._validator) {
      throw new BuildTransactionError('Invalid transaction: missing validator');
    }
    if (!isValidAddress(this._validator)) {
      throw new InvalidParameterValueError('Invalid validator address');
    }
    if (!this._delegator) {
      throw new BuildTransactionError('Invalid transaction: missing delegator');
    }
    if (!isValidAddress(this._delegator)) {
      throw new InvalidParameterValueError('Invalid delegator address');
    }
    if (!this._amount) {
      throw new BuildTransactionError('Invalid transaction: missing amount');
    }
    if (!isValidAmount(this._amount)) {
      throw new InvalidParameterValueError('Invalid amount');
    }
    super.validateMandatoryFields();
  }
  //endregion
}
