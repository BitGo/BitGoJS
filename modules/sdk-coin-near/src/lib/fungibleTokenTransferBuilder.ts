import assert from 'assert';

import BigNumber from 'bignumber.js';
import * as NearAPI from 'near-api-js';

import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { FT_TRANSFER, STORAGE_DEPOSIT } from './constants';
import { ContractCallWrapper } from './contractCallWrapper';
import { StorageDepositInput } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import utils from './utils';

export class FungibleTokenTransferBuilder extends TransactionBuilder {
  private contractCallWrapper: ContractCallWrapper;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.contractCallWrapper = new ContractCallWrapper();
    this.contractCallWrapper.methodName = FT_TRANSFER;
  }

  /**
   * Check if a transaction is a fungible token transfer
   *
   * @param {NearAPI.transactions.Action[]} actions near transaction actions
   * @returns {Boolean} true if more than 1 action present or first action method name is ft transfer
   */
  public static isFungibleTokenTransferTransaction(actions: NearAPI.transactions.Action[]): boolean {
    return actions.length > 1 || actions[0].functionCall?.methodName === FT_TRANSFER;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    for (const action of tx.nearTransaction.actions) {
      if (action.functionCall && action.functionCall.methodName === FT_TRANSFER) {
        this.contractCallWrapper.deposit = action.functionCall.deposit.toString();
        this.contractCallWrapper.gas = action.functionCall.gas.toString();
      }
    }
  }

  /**
   * Sets the gas of this transaction.
   *
   * @param {String} gas the gas of this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  public gas(gas: string): this {
    this.validateValue(new BigNumber(gas));
    this.contractCallWrapper.gas = gas;
    return this;
  }

  /**
   * Sets the deposit of at-least 1 yoctoNear
   *
   * @param {string} deposit the deposit in the minimum unit (1 Near = 1e24 yoctoNear) of this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  public deposit(deposit: string): this {
    this.validateValue(new BigNumber(deposit));
    this.contractCallWrapper.deposit = deposit;
    return this;
  }

  /**
   * Sets the actual receiver account id inside args
   *
   * @param accountId the receiver account id
   */
  public ftReceiverId(accountId: string): this {
    utils.isValidAddress(accountId);
    this.contractCallWrapper.args = { receiver_id: accountId };
    return this;
  }

  /**
   * Sets the ft amount to be transferred
   *
   * @param amount the amount of fungible token to be transferred
   */
  public amount(amount: string): this {
    this.validateValue(new BigNumber(amount));
    this.contractCallWrapper.args = { amount };
    return this;
  }

  /**
   * Sets the optional memo for the transfer
   *
   * @param memo
   */
  public memo(memo: string): this {
    this.contractCallWrapper.args = { memo };
    return this;
  }

  /**
   * Sets the storage deposit action
   *
   * @param {StorageDepositInput} input contains the deposit value, gas and optional account id
   * if account id is not provided then it is self transfer
   */
  public addStorageDeposit(input: StorageDepositInput): void {
    const methodName = STORAGE_DEPOSIT;
    assert(input.deposit, new BuildTransactionError('deposit is required before building storage deposit transfer'));
    assert(input.gas, new BuildTransactionError('gas is required before building fungible token transfer'));
    const args = input.accountId ? { account_id: input.accountId } : {};
    const action = NearAPI.transactions.functionCall(methodName, args, input.gas, input.deposit);
    super.action(action);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const { methodName, args, gas, deposit } = this.contractCallWrapper.getParams();
    assert(gas, new BuildTransactionError('gas is required before building fungible token transfer'));
    assert(deposit, new BuildTransactionError('deposit is required before building fungible token transfer'));

    if (!this._actions || this._actions.length === 0 || this._actions[0].functionCall?.methodName !== methodName) {
      super.action(NearAPI.transactions.functionCall(methodName, args, BigInt(gas), BigInt(deposit)));
    }
    const tx = await super.buildImplementation();
    tx.setTransactionType(TransactionType.Send);
    return tx;
  }
}
