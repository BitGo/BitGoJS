import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { CLValue, CLPublicKey as PublicKey, RuntimeArgs, CLValueBuilder } from 'casper-js-sdk';

import { BuildTransactionError, InvalidParameterValueError, SigningError } from '../baseCoin/errors';
import { BaseKey } from '../baseCoin/iface';
import { TransactionType, StakingOperationTypes } from '../baseCoin';
import { TransactionBuilder, DEFAULT_M } from './transactionBuilder';
import { Transaction } from './transaction';
import {
  TRANSACTION_TYPE,
  DELEGATE_VALIDATOR,
  DELEGATE_FROM_ADDRESS,
  STAKING_TYPE,
  DELEGATE_CONTRACT_ACTION,
  DELEGATE_VALIDATOR_ACCOUNT,
} from './constants';
import {
  isValidDelegateAmount,
  isValidAddress,
  getTransferAmount,
  getValidatorAddress,
  casperContractHexCode,
} from './utils';
import { DelegateUndelegateContractArgs } from './ifaces';

export class DelegateBuilder extends TransactionBuilder {
  private _validator: string;
  private readonly _action: string;
  private _amount: string;
  private readonly _contract: Uint8Array;

  /**
   * Public constructor.
   *
   * @param {CoinConfig} _coinConfig Coin configuration object
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._action = DELEGATE_CONTRACT_ACTION;
    this._contract = Uint8Array.from(Buffer.from(casperContractHexCode, 'hex'));
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._validator = this._validator || DELEGATE_VALIDATOR_ACCOUNT;
    const args = this.buildDelegateParameters();
    const extraArguments = new Map<string, CLValue>();

    extraArguments.set(TRANSACTION_TYPE, CLValueBuilder.string(TransactionType[TransactionType.StakingLock]));
    extraArguments.set(STAKING_TYPE, CLValueBuilder.string(StakingOperationTypes[StakingOperationTypes.LOCK]));
    extraArguments.set(DELEGATE_FROM_ADDRESS, CLValueBuilder.string(this._source.address));
    extraArguments.set(DELEGATE_VALIDATOR, CLValueBuilder.string(this._validator));

    this._session = {
      moduleBytes: this._contract,
      args: RuntimeArgs.fromMap(args),
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
   *
   * @returns {DelegateUndelegateContractArgs} contracts args to create a session
   */
  private buildDelegateParameters(): DelegateUndelegateContractArgs {
    const delegator = PublicKey.fromHex(this._source.address);
    const validator = PublicKey.fromHex(this._validator);

    return {
      action: CLValueBuilder.string(this._action),
      delegator: CLValueBuilder.publicKey(delegator.value(), delegator.tag),
      validator: CLValueBuilder.publicKey(validator.value(), validator.tag),
      amount: CLValueBuilder.u512(this._amount),
    };
  }

  // region Transfer fields
  /**
   * Set the destination address where the funds will be sent,
   *
   * @param {string} address the 68 bits address to transfer funds to
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
   * Set the amount to be transferred
   *
   * @param {string} amount amount to transfer
   * @returns {DelegateBuilder} the builder with the new parameter set
   */
  amount(amount: string): this {
    if (!isValidDelegateAmount(amount)) {
      throw new InvalidParameterValueError('Invalid amount');
    }
    this._amount = amount;
    return this;
  }

  // endregion

  // region Validators

  /**
   * Validate mandatory fields in the class
   *
   * @throws {Error} In case of missing or invalid fields
   */
  validateMandatoryFields(): void {
    if (!this._amount) {
      throw new BuildTransactionError('Invalid transaction: missing amount');
    }
    if (!isValidDelegateAmount(this._amount)) {
      throw new InvalidParameterValueError('Invalid amount');
    }
    super.validateMandatoryFields();
  }
  // endregion
}
