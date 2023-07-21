import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { InstructionBuilderTypes } from './constants';

import assert from 'assert';
import { StakingAuthorize } from './iface';
import { validateAddress } from './utils';

export class StakingAuthorizeBuilder extends TransactionBuilder {
  protected _stakingAddress: string;
  protected _newAuthorizedAddress: string;
  protected _oldAuthorizedAddress: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingAuthorize;
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.StakingAuthorize) {
        const AuthorizeInstruction: StakingAuthorize = instruction;
        this.stakingAddress(AuthorizeInstruction.params.stakingAddress);
        this.newAuthorizedAddress(AuthorizeInstruction.params.newAuthorizeAddress);
        this.oldAuthorizedAddress(AuthorizeInstruction.params.oldAuthorizeAddress);
      }
    }
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
    validateAddress(stakingAddress, 'stakingAddress');
    this._stakingAddress = stakingAddress;
    return this;
  }

  /**
   * The address of the new staking account authorization.
   *
   * @param {string} stakingAddress public address of the staking account.
   * @returns {StakeBuilder} This staking builder.
   *
   * @see https://docs.solana.com/staking/stake-accounts#account-address
   */
  newAuthorizedAddress(newAuthorizedAddress: string): this {
    validateAddress(newAuthorizedAddress, 'newAuthorizedAddress');
    this._newAuthorizedAddress = newAuthorizedAddress;
    return this;
  }

  /**
   * The address of the new staking account authorization.
   *
   * @param {string} stakingAddress public address of the staking account.
   * @returns {StakeBuilder} This staking builder.
   *
   * @see https://docs.solana.com/staking/stake-accounts#account-address
   */
  oldAuthorizedAddress(oldAuthorizedAddress: string): this {
    validateAddress(oldAuthorizedAddress, 'oldAuthorizedAddress');
    this._oldAuthorizedAddress = oldAuthorizedAddress;
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._stakingAddress, 'Staking Address must be set before building the transaction');
    assert(this._newAuthorizedAddress, 'new authorized Address must be set before building the transaction');
    assert(this._oldAuthorizedAddress, 'old authorized Address must be set before building the transaction');

    const stakingAccountData: StakingAuthorize = {
      type: InstructionBuilderTypes.StakingAuthorize,
      params: {
        stakingAddress: this._stakingAddress,
        newWithdrawAddress: this._newAuthorizedAddress,
        newAuthorizeAddress: this._newAuthorizedAddress,
        oldAuthorizeAddress: this._oldAuthorizedAddress,
      },
    };
    this._instructionsData = [stakingAccountData];

    return await super.buildImplementation();
  }
}
