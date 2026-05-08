import assert from 'assert';
import BigNumber from 'bignumber.js';
import * as NearAPI from 'near-api-js';

import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { ContractCallWrapper } from './contractCallWrapper';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { STORAGE_DEPOSIT } from './constants';
import utils from './utils';

export class StorageDepositTransferBuilder extends TransactionBuilder {
  private contractCallWrapper: ContractCallWrapper;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.contractCallWrapper = new ContractCallWrapper();
    this.contractCallWrapper.methodName = STORAGE_DEPOSIT;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    for (const action of tx.nearTransaction.actions) {
      if (action.functionCall && action.functionCall.methodName === STORAGE_DEPOSIT) {
        this.contractCallWrapper.deposit = action.functionCall.deposit.toString();
        this.contractCallWrapper.gas = action.functionCall.gas.toString();
        break;
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
  public beneficiaryId(accountId: string): this {
    utils.isValidAddress(accountId);
    this.contractCallWrapper.args = { account_id: accountId };
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const { methodName, args, gas, deposit } = this.contractCallWrapper.getParams();
    assert(gas, new BuildTransactionError('gas is required before building fungible token transfer'));
    assert(deposit, new BuildTransactionError('deposit is required before building fungible token transfer'));

    if (!this._actions || !this._actions.length) {
      super.action(NearAPI.transactions.functionCall(methodName, args, BigInt(gas), BigInt(deposit)));
    }
    const tx = await super.buildImplementation();
    tx.setTransactionType(TransactionType.StorageDeposit);
    return tx;
  }
}
