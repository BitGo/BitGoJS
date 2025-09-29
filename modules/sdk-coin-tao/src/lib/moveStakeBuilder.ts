import { Interface, Schema, Transaction, TransactionBuilder } from '@bitgo/abstract-substrate';
import { InvalidTransactionError, TransactionType, BaseAddress } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DecodedSignedTx, DecodedSigningPayload, defineMethod, UnsignedTransaction } from '@substrate/txwrapper-core';
import BigNumber from 'bignumber.js';
import { TAO_CONSTANTS } from './constants';
import { MoveStakeTransaction } from './moveStakeTransaction';

export class MoveStakeBuilder extends TransactionBuilder {
  protected _originHotkey: string;
  protected _destinationHotkey: string;
  protected _originNetuid: string;
  protected _destinationNetuid: string;
  protected _alphaAmount: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new MoveStakeTransaction(_coinConfig);
  }

  /**
   * Construct a transaction to move stake
   * @returns {UnsignedTransaction} an unsigned move stake transaction
   */
  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return this.moveStake(
      {
        originHotkey: this._originHotkey,
        destinationHotkey: this._destinationHotkey,
        originNetuid: this._originNetuid,
        destinationNetuid: this._destinationNetuid,
        alphaAmount: this._alphaAmount,
      },
      baseTxInfo
    );
  }

  /** @inheritdoc */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingRedelegate;
  }

  /**
   * Set the amount to move
   * @param {string} amount to move
   * @returns {MoveStakeBuilder} This builder.
   */
  amount(amount: string): this {
    const value = new BigNumber(amount);
    this.validateAmount(value);
    this._alphaAmount = amount;
    return this;
  }

  /**
   * Set the origin hot key address
   * @param {string} address of origin hotkey
   * @returns {MoveStakeBuilder} This builder.
   */
  originHotkey({ address }: BaseAddress): this {
    this.validateAddress({ address });
    this._originHotkey = address;
    return this;
  }

  /**
   * Set the destination hot key address
   * @param {string} address of destination hotkey
   * @returns {MoveStakeBuilder} This builder.
   */
  destinationHotkey({ address }: BaseAddress): this {
    this.validateAddress({ address });
    this._destinationHotkey = address;
    return this;
  }

  /**
   * Set the origin netuid of the subnet (root network is 0)
   * @param {string} netuid of subnet
   * @returns {MoveStakeBuilder} This builder.
   */
  originNetuid(netuid: string): this {
    this.validateNetuid(netuid);
    this._originNetuid = netuid;
    return this;
  }

  /**
   * Set the destination netuid of the subnet (root network is 0)
   * @param {string} netuid of subnet
   * @returns {MoveStakeBuilder} This builder.
   */
  destinationNetuid(netuid: string): this {
    this.validateNetuid(netuid);
    this._destinationNetuid = netuid;
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name !== Interface.MethodNames.MoveStake) {
      throw new InvalidTransactionError(
        `Invalid Transaction Type: ${this._method?.name}. Expected ${Interface.MethodNames.MoveStake}`
      );
    }
    const txMethod = this._method.args as Interface.MoveStakeArgs;
    this.amount(txMethod.alphaAmount);
    this.originHotkey({ address: txMethod.originHotkey });
    this.destinationHotkey({ address: txMethod.destinationHotkey });
    this.originNetuid(txMethod.originNetuid);
    this.destinationNetuid(txMethod.destinationNetuid);
    return tx;
  }

  /** @inheritdoc */
  validateTransaction(_: Transaction): void {
    super.validateTransaction(_);
    this.validateFields(
      this._originHotkey,
      this._destinationHotkey,
      this._originNetuid,
      this._destinationNetuid,
      this._alphaAmount
    );
  }

  /**
   * @param {BigNumber} amount amount to validate
   * @throws {InvalidTransactionError} if amount is less than or equal to zero
   */
  private validateAmount(amount: BigNumber): void {
    if (amount.isLessThanOrEqualTo(0)) {
      throw new InvalidTransactionError('Amount must be greater than zero');
    }
  }

  /**
   * @param {string} netuid netuid to validate
   * @throws {InvalidTransactionError} if netuid is out of range
   */
  private validateNetuid(netuid: string): void {
    const trimmed = netuid.trim();

    if (!/^\d+$/.test(trimmed)) {
      throw new InvalidTransactionError(`Invalid netuid: ${netuid}. Must be a non-negative integer.`);
    }

    const num = Number(trimmed);
    if (num < 0 || num > TAO_CONSTANTS.MAX_NETUID) {
      throw new InvalidTransactionError(
        `Invalid netuid: ${netuid}. Netuid must be between 0 and ${TAO_CONSTANTS.MAX_NETUID}.`
      );
    }
  }

  /**
   * Helper method to validate whether tx params have the correct type and format
   * @param {string} originHotkey origin hotkey address
   * @param {string} destinationHotkey destination hotkey address
   * @param {string} originNetuid netuid of the origin subnet
   * @param {string} destinationNetuid netuid of the destination subnet
   * @param {string} alphaAmount amount to move
   * @throws {InvalidTransactionError} if validation fails
   */
  private validateFields(
    originHotkey: string,
    destinationHotkey: string,
    originNetuid: string,
    destinationNetuid: string,
    alphaAmount: string
  ): void {
    // Validate netuid ranges
    this.validateNetuid(originNetuid);
    this.validateNetuid(destinationNetuid);

    const validationResult = Schema.MoveStakeTransactionSchema.validate({
      originHotkey,
      destinationHotkey,
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
    if (decodedTxn.method?.name === Interface.MethodNames.MoveStake) {
      const txMethod = decodedTxn.method.args as unknown as Interface.MoveStakeArgs;

      const validationResult = Schema.MoveStakeTransactionSchema.validate(txMethod);
      if (validationResult.error) {
        throw new InvalidTransactionError(
          `Move Stake Transaction validation failed: ${validationResult.error.message}`
        );
      }
    }
  }

  /**
   * Construct a transaction to move stake
   *
   * @param {Interface.MoveStakeArgs} args arguments to be passed to the moveStake method
   * @param {Interface.CreateBaseTxInfo} info txn info required to construct the moveStake txn
   * @returns {UnsignedTransaction} an unsigned move stake transaction
   */
  private moveStake(args: Interface.MoveStakeArgs, info: Interface.CreateBaseTxInfo): UnsignedTransaction {
    return defineMethod(
      {
        method: {
          args,
          name: 'moveStake',
          pallet: 'subtensorModule',
        },
        ...info.baseTxInfo,
      },
      info.options
    );
  }
}
