import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { CLValue, PublicKey, RuntimeArgs } from 'casper-client-sdk';
import BigNumber from 'bignumber.js';
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
  UNDELEGATE_CONTRACT_ACTION,
} from './constants';
import {
  isValidAmount,
  isValidAddress,
  getTransferAmount,
  getDelegatorAddress,
  getValidatorAddress,
  casperContractHexCode,
} from './utils';
import { DelegateUndelegateContractArgs } from './ifaces';

export class UndelegateBuilder extends TransactionBuilder {
  private _validator: string;
  private _delegator: string;
  private _action: string;
  private _amount: string;
  private _contract: Uint8Array;

  /**
   * Public constructor.
   *
   * @param {CoinConfig} _coinConfig Coin configuration object
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._action = UNDELEGATE_CONTRACT_ACTION;
    this._contract = Uint8Array.from(Buffer.from(casperContractHexCode, 'hex'));
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const args = this.buildUndelegateParameters();
    const extraArguments = new Map<string, CLValue>();
    if (this._delegator && this._validator) {
      extraArguments.set(TRANSACTION_TYPE, CLValue.string(TransactionType[TransactionType.StakingUnlock]));
      extraArguments.set(STAKING_TYPE, CLValue.string(StakingOperationTypes[StakingOperationTypes.UNLOCK]));
      // TODO(STLX-1691): We are send the destination address as string until impediment STLX-1691 is fixed.
      // After that we will change this to send an instance of PublicKey instead.
      extraArguments.set(DELEGATE_FROM_ADDRESS, CLValue.string(this._delegator));
      extraArguments.set(DELEGATE_VALIDATOR, CLValue.string(this._validator));
    }
    this._session = {
      moduleBytes: this._contract,
      args: RuntimeArgs.fromMap(args),
      extraArguments: extraArguments,
    };
    this.transaction.setTransactionType(TransactionType.StakingUnlock);
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

  /**
   * Build args needed to create a session, then we can send this session with the contract
   * @returns {DelegateUndelegateContractArgs} contracts args to create a session
   */
  private buildUndelegateParameters(): DelegateUndelegateContractArgs {
    const delegator = PublicKey.fromHex(SECP256K1_PREFIX + this._delegator);
    const validator = PublicKey.fromHex(SECP256K1_PREFIX + this._validator);

    return {
      action: CLValue.string(this._action),
      delegator: CLValue.publicKey(delegator.rawPublicKey),
      validator: CLValue.publicKey(validator.rawPublicKey),
      amount: CLValue.u512(new BigNumber(this._amount).toNumber())
    };
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

  /**
   * Validate mandatory fields in the class
   *
   * @throws {Error} In case of missing or invalid fields
   */
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
