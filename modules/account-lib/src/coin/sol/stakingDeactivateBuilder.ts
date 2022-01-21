import { BaseCoin as CoinConfig } from '@bitgo/statics';
import assert from 'assert';

import { TransactionType } from '../baseCoin';
import { BuildTransactionError } from '../baseCoin/errors';
import { InstructionBuilderTypes } from './constants';
import { StakingDeactivate } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { validateStakingAddress } from './utils';

export class StakingDeactivateBuilder extends TransactionBuilder {
  protected _stakingAddress: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingDeactivate;
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.StakingDeactivate) {
        const deactivateInstruction: StakingDeactivate = instruction;
        this.sender(deactivateInstruction.params.fromAddress);
        this.stakingAddress(deactivateInstruction.params.stakingAddress);
      }
    }
  }

  /**
   * The staking address of the staking account.
   *
   * @param {string} stakingAddress public address of the staking account
   * @returns {StakingDeactivateBuilder} This staking deactivate builder.
   *
   * @see https://docs.solana.com/staking/stake-accounts#account-address
   */
  stakingAddress(stakingAddress: string): this {
    validateStakingAddress(stakingAddress);
    this._stakingAddress = stakingAddress;
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._sender, 'Sender must be set before building the transaction');
    assert(this._stakingAddress, 'Staking address must be set before building the transaction');

    if (this._sender === this._stakingAddress) {
      throw new BuildTransactionError('Sender address cannot be the same as the Staking address');
    }

    const stakingDeactivateData: StakingDeactivate = {
      type: InstructionBuilderTypes.StakingDeactivate,
      params: {
        fromAddress: this._sender,
        stakingAddress: this._stakingAddress,
      },
    };
    this._instructionsData = [stakingDeactivateData];

    return await super.buildImplementation();
  }
}
