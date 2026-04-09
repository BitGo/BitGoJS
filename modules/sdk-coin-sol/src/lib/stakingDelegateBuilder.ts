import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { InstructionBuilderTypes } from './constants';

import assert from 'assert';
import { StakingDelegate } from './iface';
import { validateAddress } from './utils';

export class StakingDelegateBuilder extends TransactionBuilder {
  protected _stakingAddress: string;
  protected _stakingAddresses: string[];
  protected _validator: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingDelegate;
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    const stakingAddresses: string[] = [];
    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.StakingDelegate) {
        const activateInstruction: StakingDelegate = instruction;
        this.sender(activateInstruction.params.fromAddress);
        stakingAddresses.push(activateInstruction.params.stakingAddress);
        this.validator(activateInstruction.params.validator);
      }
    }
    if (stakingAddresses.length > 1) {
      this.stakingAddresses(stakingAddresses);
    } else {
      this.stakingAddress(stakingAddresses[0]);
    }
  }

  /**
   * The address of the staking account.
   *
   * @param {string} stakingAddress public address of the staking account.
   * @returns {StakingDelegateBuilder} This staking delegate builder.
   *
   * @see https://docs.solana.com/staking/stake-accounts#account-address
   */
  stakingAddress(stakingAddress: string): this {
    validateAddress(stakingAddress, 'stakingAddress');
    this._stakingAddress = stakingAddress;
    return this;
  }

  /**
   * The staking addresses of the staking account.
   *
   * @param {string[]} stakingAddresses public address of the staking accounts
   * @returns {StakingDelegateBuilder} This staking delegate builder.
   *
   * @see https://docs.solana.com/staking/stake-accounts#account-address
   */
  stakingAddresses(stakingAddresses: string[]): this {
    assert(stakingAddresses.length > 0, 'stakingAddresses must not be empty');
    for (const stakingAddress of stakingAddresses) {
      validateAddress(stakingAddress, 'stakingAddress');
    }
    this._stakingAddresses = stakingAddresses;
    return this;
  }

  /**
   * Set validator address to delegate funds to.
   *
   * @param {string} validator Validator address to delegate funds to.
   * @returns {StakingDelegateBuilder} This staking builder.
   *
   */
  validator(validator: string): this {
    validateAddress(validator, 'validator');
    this._validator = validator;
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._sender, 'Sender must be set before building the transaction');
    assert(this._validator, 'Validator must be set before building the transaction');

    if (this._stakingAddresses && this._stakingAddresses.length > 0) {
      this._instructionsData = [];
      for (const stakingAddress of this._stakingAddresses) {
        assert(stakingAddress, 'Staking Address must be set before building the transaction');
        if (this._sender === stakingAddress) {
          throw new BuildTransactionError('Sender address cannot be the same as the Staking address');
        }
        const stakingAccountData: StakingDelegate = {
          type: InstructionBuilderTypes.StakingDelegate,
          params: {
            fromAddress: this._sender,
            stakingAddress: stakingAddress,
            validator: this._validator,
          },
        };
        this._instructionsData.push(stakingAccountData);
      }
    } else {
      assert(this._stakingAddress, 'Staking Address must be set before building the transaction');
      if (this._sender === this._stakingAddress) {
        throw new BuildTransactionError('Sender address cannot be the same as the Staking address');
      }

      const stakingAccountData: StakingDelegate = {
        type: InstructionBuilderTypes.StakingDelegate,
        params: {
          fromAddress: this._sender,
          stakingAddress: this._stakingAddress,
          validator: this._validator,
        },
      };
      this._instructionsData = [stakingAccountData];
    }
    return await super.buildImplementation();
  }
}
