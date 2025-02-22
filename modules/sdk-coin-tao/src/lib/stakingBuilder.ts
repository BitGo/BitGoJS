import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { defineMethod, UnsignedTransaction } from '@substrate/txwrapper-core';
import BigNumber from 'bignumber.js';
import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { Transaction, TransferBuilder as SubstrateTransferBuilder } from '@bitgo/abstract-substrate';
import { StakeTransactionSchema } from './txnSchema';
import { AddStakeArgs, CreateBaseTxInfo, MethodNames } from './iface';

export class StakingBuilder extends SubstrateTransferBuilder {
  protected _amount: string;
  protected _hotkey: string;
  protected _netuid: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Take the origin account as a stash and lock up value of its balance.
   * Controller will be the account that controls it.
   *
   * @returns {UnsignedTransaction} an unsigned Dot transaction
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#staking
   */
  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return this.addStake(
      {
        amount_staked: this._amount,
        hotkey: this._hotkey,
        netuid: this._netuid,
      },
      baseTxInfo
    );
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingActivate;
  }

  /**
   * The amount to stake.
   *
   * @param {string} amount
   * @returns {StakeBuilder} This staking builder.
   *
   * @see https://wiki.polkadot.network/docs/learn-nominator#required-minimum-stake
   */
  amount(amount: string): this {
    this.validateValue(new BigNumber(amount));
    this._amount = amount;
    return this;
  }

  /**
   * The controller of the staked amount.
   *
   * @param {string} hotkey
   * @returns {StakeBuilder} This staking builder.
   *
   * @see https://wiki.polkadot.network/docs/learn-staking#accounts
   */
  hotkey(hotkey: string): this {
    this._hotkey = hotkey;
    return this;
  }

  netuid(netuid: string): this {
    this._netuid = netuid;
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.AddStake) {
      const txMethod = this._method.args as AddStakeArgs;
      this.amount(txMethod.amount_staked);
      this.hotkey(txMethod.hotkey);
      this.netuid(txMethod.netuid);
    } else {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected bond or bondExtra`);
    }
    return tx;
  }

  /** @inheritdoc */
  validateTransaction(_: Transaction): void {
    super.validateTransaction(_);
    this.validateFields(this._amount, this._hotkey);
  }

  private validateFields(value: string, hotkey: string): void {
    const validationResult = StakeTransactionSchema.validate({
      value,
      hotkey,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(
        `Stake Builder Transaction validation failed: ${validationResult.error.message}`
      );
    }
  }

  /**
   * Construct a transaction to stake
   *
   * @param args - Arguments specific to this method.
   * @param info - Information required to construct the transaction.
   */
  private addStake(args: AddStakeArgs, info: CreateBaseTxInfo): UnsignedTransaction {
    return defineMethod(
      {
        method: {
          args,
          name: 'addStake',
          pallet: 'subtensorModule',
        },
        ...info.baseTxInfo,
      },
      info.options
    );
  }
}
