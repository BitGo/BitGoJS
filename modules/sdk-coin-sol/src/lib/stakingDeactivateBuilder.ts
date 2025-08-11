import { BaseCoin as CoinConfig } from '@bitgo/statics';
import assert from 'assert';

import { BuildTransactionError, Recipient, TransactionType } from '@bitgo/sdk-core';
import { InstructionBuilderTypes, STAKE_ACCOUNT_RENT_EXEMPT_AMOUNT } from './constants';
import { StakingDeactivate, Transfer } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { isValidStakingAmount, validateAddress } from './utils';

export class StakingDeactivateBuilder extends TransactionBuilder {
  protected _stakingAddress: string;
  protected _stakingAddresses: string[];
  protected _amount?: string;
  protected _unstakingAddress: string;
  protected _isMarinade = false;
  protected _isJito = false;
  protected _recipients: Recipient[];
  protected _jitoParams?: StakingDeactivate['params']['jitoParams'];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingDeactivate;
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    const stakingAddresses: string[] = [];
    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.StakingDeactivate) {
        const deactivateInstruction: StakingDeactivate = instruction;
        // Since _stakingAddresses needs to be populated, it gets special treatment.
        stakingAddresses.push(deactivateInstruction.params.stakingAddress);

        // Marinade staking also cares about sender.
        if (!deactivateInstruction.params.isMarinade) {
          this.sender(deactivateInstruction.params.fromAddress);
        }

        // The other values can just be copied.
        if (deactivateInstruction.params.amount !== undefined) {
          this.amount(deactivateInstruction.params.amount);
        }
        if (deactivateInstruction.params.unstakingAddress !== undefined) {
          this.unstakingAddress(deactivateInstruction.params.unstakingAddress);
        }
        if (deactivateInstruction.params.isMarinade !== undefined) {
          this.isMarinade(deactivateInstruction.params.isMarinade);
        }
        if (deactivateInstruction.params.isJito !== undefined) {
          this.isJito(deactivateInstruction.params.isJito);
        }
        if (deactivateInstruction.params.recipients !== undefined) {
          this.recipients(deactivateInstruction.params.recipients);
        }
        if (deactivateInstruction.params.jitoParams !== undefined) {
          this.jitoParams(deactivateInstruction.params.jitoParams);
        }
      }
    }
    if (stakingAddresses.length > 1) {
      this.stakingAddresses(stakingAddresses);
    } else {
      if (!this._isMarinade) {
        this.stakingAddress(stakingAddresses[0]);
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
    validateAddress(stakingAddress, 'stakingAddress');
    this._stakingAddress = stakingAddress;
    return this;
  }

  /**
   * The staking addresses of the staking account.
   *
   * @param {string[]} stakingAddresses public address of the staking accounts
   * @returns {StakingDeactivateBuilder} This staking deactivate builder.
   *
   * @see https://docs.solana.com/staking/stake-accounts#account-address
   */
  stakingAddresses(stakingAddresses: string[]): this {
    for (const stakingAddress of stakingAddresses) {
      validateAddress(stakingAddress, 'stakingAddress');
    }
    this._stakingAddresses = stakingAddresses;
    return this;
  }

  /**
   * Optional amount to unstake expressed in Lamports, 1 SOL = 1_000_000_000 lamports, to be used
   * when partially unstaking. If not given then the entire staked amount will be unstaked.
   *
   * @param {string} amount The partial amount to unstake, expressed in Lamports.
   * @returns {StakingDeactivateBuilder} This staking builder.
   *
   * @see https://docs.solana.com/cli/delegate-stake#split-stake
   */
  amount(amount: string): this {
    if (!isValidStakingAmount(amount)) {
      throw new BuildTransactionError('If given, amount cannot be zero or less');
    }
    this._amount = amount;
    return this;
  }

  /**
   * Setter to set the recipients object
   *
   * @param recipients RecipientEntry[] - The recipients object
   * @returns {StakingDeactivateBuilder} This staking builder.
   */
  recipients(recipients: Recipient[]): this {
    this._recipients = recipients;
    return this;
  }

  /**
   * When partially unstaking move the amount to unstake to this account and initiate the
   * unstake process. The original stake account will continue staking.
   *
   * @param {string} unstakingAddress An account used to unstake a partial amount.
   * @returns {StakingDeactivateBuilder} This staking builder.
   *
   * @see https://docs.solana.com/cli/delegate-stake#split-stake
   */
  unstakingAddress(unstakingAddress: string): this {
    validateAddress(unstakingAddress, 'unstakingAddress');
    this._unstakingAddress = unstakingAddress;
    return this;
  }

  /**
   * Set isMarinade flag
   * @param {boolean} flag - true if the transaction is for Marinade, false by default if not set
   * @returns {StakingDectivateBuilder} This staking builder
   */
  isMarinade(flag: boolean): this {
    this._isMarinade = flag;
    return this;
  }

  /**
   * Set isJito flag
   * @param {boolean} flag - true if the transaction is for Jito, false by default if not set
   * @returns {StakingDeactivateBuilder} This staking builder
   */
  isJito(flag: boolean): this {
    this._isJito = flag;
    return this;
  }

  /**
   * Set parameters specific to Jito unstaking.
   *
   * @param {string} jitoParams parameters specific to Jito unstaking.
   * @returns {StakingDeactivateBuilder} This staking builder.
   */
  jitoParams(jitoParams: StakingDeactivate['params']['jitoParams']): this {
    this._jitoParams = jitoParams;
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._sender, 'Sender must be set before building the transaction');
    assert(this._isMarinade !== undefined, 'isMarinade must be set before building the transaction');

    if (this._stakingAddresses && this._stakingAddresses.length > 0) {
      this._instructionsData = [];
      for (const stakingAddress of this._stakingAddresses) {
        const stakingDeactivateData: StakingDeactivate = {
          type: InstructionBuilderTypes.StakingDeactivate,
          params: {
            fromAddress: this._sender,
            stakingAddress: stakingAddress,
          },
        };
        this._instructionsData.push(stakingDeactivateData);
      }
    } else {
      if (!this._isMarinade && !this._isJito) {
        // we don't need stakingAddress in marinade staking deactivate txn
        assert(this._stakingAddress, 'Staking address must be set before building the transaction');
      }

      if (this._sender === this._stakingAddress) {
        throw new BuildTransactionError('Sender address cannot be the same as the Staking address');
      }

      if (this._amount && !this._isMarinade && !this._isJito) {
        assert(
          this._unstakingAddress,
          'When partially unstaking the unstaking address must be set before building the transaction'
        );
      }

      this._instructionsData = [];
      if (this._unstakingAddress && !this._isMarinade && !this._isJito) {
        assert(
          this._amount,
          'If an unstaking address is given then a partial amount to unstake must also be set before building the transaction'
        );
        const stakingFundUnstakeAddress: Transfer = {
          type: InstructionBuilderTypes.Transfer,
          params: {
            fromAddress: this._sender,
            amount: STAKE_ACCOUNT_RENT_EXEMPT_AMOUNT.toString(),
            toAddress: this._unstakingAddress,
          },
        };
        this._instructionsData.push(stakingFundUnstakeAddress);
      }

      const stakingDeactivateData: StakingDeactivate = {
        type: InstructionBuilderTypes.StakingDeactivate,
        params: {
          fromAddress: this._sender,
          stakingAddress: this._stakingAddress,
          amount: this._amount,
          unstakingAddress: this._unstakingAddress,
          isMarinade: this._isMarinade,
          isJito: this._isJito,
          recipients: this._recipients,
          jitoParams: this._jitoParams,
        },
      };
      this._instructionsData.push(stakingDeactivateData);
    }

    return await super.buildImplementation();
  }
}
