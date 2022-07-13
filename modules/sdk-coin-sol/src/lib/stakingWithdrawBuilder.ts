import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { InstructionBuilderTypes } from './constants';

import assert from 'assert';
import { StakingWithdraw } from './iface';
import { isValidStakingAmount, validateAddress } from './utils';

export class StakingWithdrawBuilder extends TransactionBuilder {
  protected _stakingAddress: string;
  protected _amount: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingWithdraw;
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.StakingWithdraw) {
        const withdrawInstruction: StakingWithdraw = instruction;
        this.sender(withdrawInstruction.params.fromAddress);
        this.stakingAddress(withdrawInstruction.params.stakingAddress);
        this.amount(withdrawInstruction.params.amount);
      }
    }
  }

  /**
   * The address of the staking account.
   *
   * @param {string} stakingAddress public address of the staking account
   * @returns {StakeBuilder} This staking builder.
   *
   */
  stakingAddress(stakingAddress: string): this {
    validateAddress(stakingAddress, 'stakingAddress');
    this._stakingAddress = stakingAddress;
    return this;
  }

  /**
   * The amount to withdraw expressed in Lamports, 1 SOL = 1_000_000_000 lamports
   *
   * @param {string} amount expressed in Lamports
   * @returns {StakeBuilder} This staking builder.
   *
   */
  amount(amount: string): this {
    if (!isValidStakingAmount(amount)) {
      throw new BuildTransactionError('Value cannot be zero or less');
    }
    this._amount = amount;
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._sender, 'Sender must be set before building the transaction');
    assert(this._stakingAddress, 'Staking address must be set before building the transaction');
    assert(this._amount, 'Amount must be set before building the transaction');

    if (this._sender === this._stakingAddress) {
      throw new BuildTransactionError('Sender address cannot be the same as the Staking address');
    }

    const stakingWithdrawData: StakingWithdraw = {
      type: InstructionBuilderTypes.StakingWithdraw,
      params: {
        fromAddress: this._sender,
        stakingAddress: this._stakingAddress,
        amount: this._amount,
      },
    };
    this._instructionsData = [stakingWithdrawData];

    return await super.buildImplementation();
  }
}
