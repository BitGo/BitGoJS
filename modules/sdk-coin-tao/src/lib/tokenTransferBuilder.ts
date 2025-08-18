import { Interface, Schema, Transaction, TransactionBuilder } from '@bitgo/abstract-substrate';
import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DecodedSignedTx, DecodedSigningPayload, defineMethod, UnsignedTransaction } from '@substrate/txwrapper-core';
import BigNumber from 'bignumber.js';
import { TokenTransferTransaction } from './tokenTransferTransaction';

export class TokenTransferBuilder extends TransactionBuilder {
  protected _destinationColdkey: string;
  protected _hotkey: string;
  protected _originNetuid: string;
  protected _destinationNetuid: string;
  protected _alphaAmount: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new TokenTransferTransaction(_coinConfig);
  }

  /**
   * Construct a transaction to transfer stake
   * @returns {UnsignedTransaction} an unsigned transfer stake transaction
   */
  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return this.transferStake(
      {
        destinationColdkey: this._destinationColdkey,
        hotkey: this._hotkey,
        originNetuid: this._originNetuid,
        destinationNetuid: this._destinationNetuid,
        alphaAmount: this._alphaAmount,
      },
      baseTxInfo
    );
  }

  /** @inheritdoc */
  protected get transactionType(): TransactionType {
    return TransactionType.SendToken;
  }

  /**
   * Set the amount to transfer
   * @param {string} amount to transfer
   * @returns {TokenTransferBuilder} This builder.
   */
  amount(amount: string): this {
    this.validateValue(new BigNumber(amount));
    this._alphaAmount = amount;
    return this;
  }

  /**
   * Set the validator hot key address
   * @param {string} hotkey address of validator
   * @returns {TokenTransferBuilder} This builder.
   */
  hotkey(address: string): this {
    this.validateAddress({ address });
    this._hotkey = address;
    return this;
  }

  /**
   * Set the destination cold key address
   * @param {string} address of the destination cold key
   * @returns {TokenTransferBuilder} This builder.
   */

  destinationColdkey(address: string): this {
    this.validateAddress({ address });
    this._destinationColdkey = address;
    return this;
  }

  /**
   * Set the origin netuid of the subnet (root network is 0)
   * @param {string} netuid of subnet
   * @returns {TokenTransferBuilder} This builder.
   */
  originNetuid(netuid: string): this {
    this._originNetuid = netuid;
    return this;
  }

  /**
   * Set the destination netuid of the subnet (root network is 0)
   * @param {string} netuid of subnet
   * @returns {TokenTransferBuilder} This builder.
   */
  destinationNetuid(netuid: string): this {
    this._destinationNetuid = netuid;
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === Interface.MethodNames.TransferStake) {
      const txMethod = this._method.args as Interface.TransferStakeArgs;
      this.amount(txMethod.alphaAmount);
      this.hotkey(txMethod.hotkey);
      this.destinationColdkey(txMethod.destinationColdkey);
      this.originNetuid(txMethod.originNetuid);
      this.destinationNetuid(txMethod.destinationNetuid);
    } else {
      throw new InvalidTransactionError(
        `Invalid Transaction Type: ${this._method?.name}. Expected ${Interface.MethodNames.TransferStake}`
      );
    }
    return tx;
  }

  /** @inheritdoc */
  validateTransaction(_: Transaction): void {
    super.validateTransaction(_);
    this.validateFields(
      this._destinationColdkey,
      this._hotkey,
      this._originNetuid,
      this._destinationNetuid,
      this._alphaAmount
    );
  }

  /**
   * Helper method to validate whether tx params have the correct type and format
   * @param {string} destinationColdkey destination cold key address
   * @param {string} hotkey hotkey address of the validator
   * @param {string} originNetuid netuid of the origin subnet
   * @param {string} destinationNetuid netuid of the destination subnet
   * @param {string} alphaAmount amount to transfer
   * @throws {InvalidTransactionError} if validation fails
   */
  private validateFields(
    destinationColdkey: string,
    hotkey: string,
    originNetuid: string,
    destinationNetuid: string,
    alphaAmount: string
  ): void {
    const validationResult = Schema.TransferStakeTransactionSchema.validate({
      destinationColdkey,
      hotkey,
      originNetuid,
      destinationNetuid,
      alphaAmount,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx, rawTransaction: string): void {
    if (decodedTxn.method?.name === Interface.MethodNames.TransferStake) {
      const txMethod = decodedTxn.method.args as unknown as Interface.TransferStakeArgs;

      const validationResult = Schema.TransferStakeTransactionSchema.validate(txMethod);
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transfer Transaction validation failed: ${validationResult.error.message}`);
      }
    }
  }

  /**
   * Construct a transaction to transfer stake
   *
   * @param {Interface.TransferStakeArgs} args arguments to be passed to the transferStake method
   * @param {Interface.CreateBaseTxInfo} info txn info required to construct the transferStake txn
   * @returns {UnsignedTransaction} an unsigned stake transaction
   */

  private transferStake(args: Interface.TransferStakeArgs, info: Interface.CreateBaseTxInfo): UnsignedTransaction {
    return defineMethod(
      {
        method: {
          args,
          name: 'transferStake',
          pallet: 'subtensorModule',
        },
        ...info.baseTxInfo,
      },
      info.options
    );
  }
}
