import assert from 'assert';
import BigNumber from 'bignumber.js';
import * as NearAPI from 'near-api-js';

import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';

import { FT_TRANSFER } from './constants';
import { ContractCallWrapper } from './contractCallWrapper';
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
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    const functionCall = tx.nearTransaction.actions[0].functionCall;
    if (functionCall) {
      this.contractCallWrapper.deposit = functionCall.deposit.toString();
      this.contractCallWrapper.gas = functionCall.gas.toString();
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
   * @inheritdoc
   *
   * We need to override this because for contract call the receiver id is the contract address
   * And we need to pass the actual receiver id in the args
   *
   * @param accountId the contract address
   */
  public receiverId(accountId: string): this {
    utils.isValidAddress(accountId);
    this._receiverId = accountId;
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

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const { methodName, args, gas, deposit } = this.contractCallWrapper.getParams();
    assert(gas, new BuildTransactionError('gas is required before building fungible token transfer'));
    assert(deposit, new BuildTransactionError('deposit is required before building fungible token transfer'));

    super.actions([NearAPI.transactions.functionCall(methodName, args, BigInt(gas), BigInt(deposit))]);
    const tx = await super.buildImplementation();
    tx.setTransactionType(TransactionType.Send);
    return tx;
  }
}
