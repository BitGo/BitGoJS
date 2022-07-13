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

export class StakingWithdrawBuilder extends TransactionBuilder {
  private contractCallWrapper: ContractCallWrapper;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.contractCallWrapper = new ContractCallWrapper();
    this.contractCallWrapper.methodName = StakingContractMethodNames.Withdraw;
    this.contractCallWrapper.deposit = '0';
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingWithdraw;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    const functionCall = tx.nearTransaction.actions[0].functionCall;
    this.contractCallWrapper.args = JSON.parse(Buffer.from(functionCall.args).toString());
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
    this.contractCallWrapper.args = { amount: amount };
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const { methodName, args, gas, deposit } = this.contractCallWrapper.getParams();
    assert(gas, new BuildTransactionError('gas is required before building staking withdraw'));
    assert(args?.amount, new BuildTransactionError('amount is required before building staking withdraw'));

    super.actions([NearAPI.transactions.functionCall(methodName, args, new BN(gas), new BN(deposit))]);
    const tx = await super.buildImplementation();
    tx.setTransactionType(TransactionType.StakingWithdraw);
    return tx;
  }
}
