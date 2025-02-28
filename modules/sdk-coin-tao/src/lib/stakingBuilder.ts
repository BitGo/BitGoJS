import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { defineMethod, UnsignedTransaction, DecodedSignedTx, DecodedSigningPayload } from '@substrate/txwrapper-core';
import BigNumber from 'bignumber.js';
import { InvalidTransactionError, TransactionType, BaseAddress } from '@bitgo/sdk-core';
import { Transaction, TransactionBuilder, Interface, Schema } from '@bitgo/abstract-substrate';

export class StakingBuilder extends TransactionBuilder {
  protected _amount: string;
  protected _hotkey: string;
  protected _netuid: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Construct a transaction to stake
   * @returns {UnsignedTransaction} an unsigned stake TAO transaction
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#staking
   */
  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return this.addStake(
      {
        amountStaked: this._amount,
        hotkey: this._hotkey,
        netuid: this._netuid,
      },
      baseTxInfo
    );
  }

  /** @inheritdoc */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingActivate;
  }

  /**
   * Set the amount to stake
   * @param {string} amount to stake
   * @returns {StakingBuilder} This staking builder.
   *
   * @see https://wiki.polkadot.network/docs/learn-nominator#required-minimum-stake
   */
  amount(amount: string): this {
    this.validateValue(new BigNumber(amount));
    this._amount = amount;
    return this;
  }

  /**
   * Set the validator hot key address
   * @param {string} hotkey address of validator
   * @returns {StakingBuilder} This staking builder.
   *
   * @see https://wiki.polkadot.network/docs/learn-staking#accounts
   */
  hotkey({ address }: BaseAddress): this {
    this.validateAddress({ address });
    this._hotkey = address;
    return this;
  }

  /**
   * Set netuid of the subnet (root network is 0)
   * @param {string} netuid of subnet
   * @returns {StakingBuilder} This staking builder.
   */
  netuid(netuid: string): this {
    this.validateNetuid(netuid);
    this._netuid = netuid;
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === Interface.MethodNames.AddStake) {
      const txMethod = this._method.args as Interface.AddStakeArgs;
      this.amount(txMethod.amountStaked);
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
   * Helper method to validate whether stake params have the correct type and format
   * @param {string} amountStaked amount to stake
   * @param {string} hotkey hotkey address of the validator
   * @param {string} netuid netuid of the subnet
   */
  private validateFields(amountStaked: string, hotkey: string, netuid: string): void {
    const validationResult = Schema.StakeTransactionSchema.validate({
      amountStaked,
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
      const amountStaked = txMethod.amountStaked;
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
   * @param {Interface.AddStakeArgs} Stake arguments to be passed to the addStake method
   * @param {Interface.CreateBaseTxInfo} Base txn info required to construct the addStake txn
   * @returns {UnsignedTransaction} an unsigned stake TAO transaction
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
