import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '../baseCoin';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { InstructionBuilderTypes } from './constants';

import assert from 'assert';
import { StakingActivate } from './iface';
import { isValidPublicKey, isValidStakingAmount, validateStakingAddress } from './utils';
import { BuildTransactionError } from '../baseCoin/errors';

export class StakingActivateBuilder extends TransactionBuilder {
  protected _amount: string;
  protected _stakingAddress: string;
  protected _validator: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingActivate;
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.StakingActivate) {
        const activateInstruction: StakingActivate = instruction;
        this.sender(activateInstruction.params.fromAddress);
        this.stakingAddress(activateInstruction.params.stakingAddress);
        this.amount(activateInstruction.params.amount);
        this.validator(activateInstruction.params.validator);
      }
    }
  }

  /**
   * The amount to stake expressed in Lamports, 1 SOL = 1_000_000_000 lamports.
   *
   * @param {string} amount expressed in Lamports.
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

  /**
   * The address of the staking account.
   *
   * @param {string} stakingAddress public address of the staking account.
   * @returns {StakeBuilder} This staking builder.
   *
   * @see https://docs.solana.com/staking/stake-accounts#account-address
   */
  stakingAddress(stakingAddress: string): this {
    validateStakingAddress(stakingAddress);
    this._stakingAddress = stakingAddress;
    return this;
  }

  /**
   * Set validator address to delegate funds to.
   *
   * @param {string} validator Validator address to delegate funds to.
   * @returns {StakeBuilder} This staking builder.
   *
   */
  validator(validator: string): this {
    if (!validator || !isValidPublicKey(validator)) {
      throw new BuildTransactionError('Invalid or missing validator, got: ' + validator);
    }
    this._validator = validator;
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._sender, 'Sender must be set before building the transaction');
    assert(this._stakingAddress, 'Staking Address must be set before building the transaction');
    assert(this._validator, 'Validator must be set before building the transaction');
    assert(this._amount, 'Amount must be set before building the transaction');

    if (this._sender === this._stakingAddress) {
      throw new BuildTransactionError('Sender address cannot be the same as the Staking address');
    }

    const stakingAccountData: StakingActivate = {
      type: InstructionBuilderTypes.StakingActivate,
      params: {
        fromAddress: this._sender,
        stakingAddress: this._stakingAddress,
        amount: this._amount,
        validator: this._validator,
      },
    };
    this._instructionsData = [stakingAccountData];

    return await super.buildImplementation();
  }
}
