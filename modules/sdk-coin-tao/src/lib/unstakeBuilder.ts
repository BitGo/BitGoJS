import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { defineMethod, UnsignedTransaction, DecodedSignedTx, DecodedSigningPayload } from '@substrate/txwrapper-core';
import BigNumber from 'bignumber.js';
import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { Transaction, TransactionBuilder, Interface, Schema } from '@bitgo/abstract-substrate';

export class UnstakeBuilder extends TransactionBuilder {
  protected _amount: number;
  protected _hotkey: string;
  protected _netuid: number;

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
    return this.removeStake(
      {
        amountUnstaked: this._amount,
        hotkey: this._hotkey,
        netuid: this._netuid,
      },
      baseTxInfo
    );
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingDeactivate;
  }

  /**
   * The amount to stake.
   *
   * @param {string} amount
   * @returns {StakeBuilder} This staking builder.
   *
   * @see https://wiki.polkadot.network/docs/learn-nominator#required-minimum-stake
   */
  amount(amount: number): this {
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

  netuid(netuid: number): this {
    this._netuid = netuid;
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === Interface.MethodNames.RemoveStake) {
      const txMethod = this._method.args as Interface.RemoveStakeArgs;
      this.amount(txMethod.amountUnstaked);
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

  private validateFields(amount: number, hotkey: string, netuid: number): void {
    const validationResult = Schema.UnstakeTransactionSchema.validate({
      amount,
      hotkey,
      netuid,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(
        `UnStake Builder Transaction validation failed: ${validationResult.error.message}`
      );
    }
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx, rawTransaction: string): void {
    if (decodedTxn.method?.name === Interface.MethodNames.RemoveStake) {
      const txMethod = decodedTxn.method.args as unknown as Interface.RemoveStakeArgs;
      const amount = txMethod.amountUnstaked;
      const hotkey = txMethod.hotkey;
      const netuid = txMethod.netuid;
      const validationResult = Schema.UnstakeTransactionSchema.validate({ amount, hotkey, netuid });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transfer Transaction validation failed: ${validationResult.error.message}`);
      }
    }
  }
  /**
//    * Construct a transaction to stake
//    *
//    * @param args - Arguments specific to this method.
//    * @param info - Information required to construct the transaction.
//    */
  private removeStake(args: Interface.RemoveStakeArgs, info: Interface.CreateBaseTxInfo): UnsignedTransaction {
    return defineMethod(
      {
        method: {
          args,
          name: 'removeStake',
          pallet: 'subtensorModule',
        },
        ...info.baseTxInfo,
      },
      info.options
    );
  }
}
