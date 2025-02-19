import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { defineMethod, UnsignedTransaction, DecodedSignedTx, DecodedSigningPayload } from '@substrate/txwrapper-core';
import BigNumber from 'bignumber.js';
import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { Transaction, TransactionBuilder, Interface, Schema } from '@bitgo/abstract-substrate';

export class StakingBuilder extends TransactionBuilder {
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
    if (this._method?.name === Interface.MethodNames.AddStake) {
      const txMethod = this._method.args as Interface.AddStakeArgs;
      this.amount(txMethod.amount_staked);
      this.hotkey(txMethod.hotkey);
      this.netuid(txMethod.netuid);
    } else {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected addStake`);
    }
    return tx;
  }

  /** @inheritdoc */
  validateTransaction(_: Transaction): void {
    super.validateTransaction(_);
    this.validateFields(this._amount, this._hotkey, this._netuid);
  }

  private validateFields(value: string, hotkey: string, netuid: string): void {
    const validationResult = Schema.StakeTransactionSchema.validate({
      value,
      hotkey,
      netuid,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(
        `Stake Builder Transaction validation failed: ${validationResult.error.message}`
      );
    }
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx, rawTransaction: string): void {
    if (decodedTxn.method?.name === Interface.MethodNames.AddStake) {
      const txMethod = decodedTxn.method.args as unknown as Interface.AddStakeArgs;
      const amountStaked = `${txMethod.amount_staked}`;
      const hotkey = txMethod.hotkey;
      const netuid = txMethod.netuid;
      const validationResult = Schema.StakeTransactionSchema.validate({ amountStaked, hotkey, netuid });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transfer Transaction validation failed: ${validationResult.error.message}`);
      }
    }
  }

  /**
   * Construct a transaction to stake
   *
   * @param args - Arguments specific to this method.
   * @param info - Information required to construct the transaction.
   */
  private addStake(args: Interface.AddStakeArgs, info: Interface.CreateBaseTxInfo): UnsignedTransaction {
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
