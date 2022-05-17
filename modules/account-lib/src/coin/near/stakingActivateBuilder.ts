import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import BigNumber from 'bignumber.js';
import * as NearAPI from 'near-api-js';
import assert from 'assert';
import BN from 'bn.js';

import { ContractCallWrapper } from './contractCallWrapper';
import { TransactionBuilder } from './transactionBuilder';
import { StakingContractMethodNames } from './constants';

export class StakingActivateBuilder extends TransactionBuilder {
  private contractCallWrapper: ContractCallWrapper;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.contractCallWrapper = new ContractCallWrapper();
    this.contractCallWrapper.methodName = StakingContractMethodNames.DepositAndStake;
    this.contractCallWrapper.args = {}; // on staking activate, the amount is on the deposit field.
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingActivate;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    const functionCall = tx.nearTransaction.actions[0].functionCall;
    this.contractCallWrapper.deposit = functionCall.deposit.toString();
    this.contractCallWrapper.gas = functionCall.gas.toString();
  }

  /**
   * Sets the gas of this transaction.
   *
   * @param {string} value the gas of this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  public gas(gas: string): this {
    this.validateValue(new BigNumber(gas));
    this.contractCallWrapper.gas = gas;
    return this;
  }

  /**
   * Sets the amount of this transaction.
   *
   * @param {string} value the amount in the minimum unit (1 Near = 1e24 yoctos) of this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  public amount(amount: string): this {
    this.validateValue(new BigNumber(amount));
    // In the staking contract call the amount must be on deposit instead of being a arg param.
    this.contractCallWrapper.deposit = amount;
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const { methodName, args, gas, deposit } = this.contractCallWrapper.getParams();
    assert(gas, new BuildTransactionError('gas is required before building staking activate'));
    assert(deposit, new BuildTransactionError('amount is required before building staking activate'));

    super.actions([NearAPI.transactions.functionCall(methodName, args, new BN(gas), new BN(deposit, 10))]);
    const tx = await super.buildImplementation();
    tx.setTransactionType(TransactionType.StakingActivate);
    return tx;
  }
}
