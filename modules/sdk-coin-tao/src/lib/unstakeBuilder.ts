import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { defineMethod, UnsignedTransaction, DecodedSignedTx, DecodedSigningPayload } from '@substrate/txwrapper-core';
import BigNumber from 'bignumber.js';
import { InvalidTransactionError, TransactionType, BaseAddress } from '@bitgo/sdk-core';
import { Transaction, TransactionBuilder, Interface, Schema } from '@bitgo/abstract-substrate';

export class UnstakeBuilder extends TransactionBuilder {
  protected _amount: string;
  protected _hotkey: string;
  protected _netuid: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Construct a transaction to unstake
   *
   * @returns {UnsignedTransaction} an unsigned unstake TAO transaction
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

  /** @inheritdoc */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingDeactivate;
  }

  /**
   * The amount to unstake.
   *
   * @param {string} amount to unstake
   * @returns {UnstakeBuilder} This unstaking builder.
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
   * @param {string} hotkey address of validator
   * @returns {UnstakeBuilder} This unstaking builder.
   *
   * @see https://wiki.polkadot.network/docs/learn-staking#accounts
   */
  hotkey({ address }: BaseAddress): this {
    this.validateAddress({ address });
    this._hotkey = address;
    return this;
  }

  /**
   * Netuid of the subnet (root network is 0)
   * @param {string} netuid
   * @returns {UnstakeBuilder} This unstaking builder
   */
  netuid(netuid: string): this {
    this._netuid = netuid;
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === Interface.MethodNames.RemoveStake) {
      const txMethod = this._method.args as Interface.RemoveStakeArgs;
      this.amount(txMethod.amountUnstaked);
      this.hotkey({ address: txMethod.hotkey });
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

  /**
   * Helper method to validate whether unstake params have the correct type and format
   * @param {string} amountUnstaked amount to unstake
   * @param {string} hotkey hotkey address of the validator
   * @param {string} netuid netuid of the subnet
   */
  private validateFields(amountUnstaked: string, hotkey: string, netuid: string): void {
    const validationResult = Schema.UnstakeTransactionSchema.validate({
      amountUnstaked,
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
      const amountUnstaked = txMethod.amountUnstaked;
      const hotkey = txMethod.hotkey;
      const netuid = txMethod.netuid;
      const validationResult = Schema.UnstakeTransactionSchema.validate({ amountUnstaked, hotkey, netuid });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transfer Transaction validation failed: ${validationResult.error.message}`);
      }
    }
  }

  /**
   * Construct a transaction to unstake
   *
   * @param {Interface.RemoveStakeArgs} RemoveStake arguments to be passed to the addStake method
   * @param {Interface.CreateBaseTxInfo} Base txn info required to construct the removeStake txn
   * @returns {UnsignedTransaction} an unsigned unstake TAO transaction
   */
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
