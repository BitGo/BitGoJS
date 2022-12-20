import { BaseCoin as CoinConfig } from '@bitgo/statics';
import EthereumAbi from 'ethereumjs-abi';
import { TransactionBuilder as EthTransactionBuilder, TxData, walletSimpleConstructor } from '@bitgo/sdk-coin-eth';
import { BuildTransactionError, TransactionType, StakingOperationTypes } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { StakingBuilder } from './stakingBuilder';
import { StakingCall } from './stakingCall';
import { getCommon, walletSimpleByteCode } from './utils';
import { TransferBuilder } from './transferBuilder';
import { addHexPrefix } from 'ethereumjs-util';
import BigNumber from 'bignumber.js';

export class TransactionBuilder extends EthTransactionBuilder {
  // Staking specific parameters
  private _stakingBuilder?: StakingBuilder;
  protected _transfer: TransferBuilder;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._common = getCommon(this._coinConfig.network.type);
    this.transaction = new Transaction(this._coinConfig, this._common);
  }

  /** @inheritdoc */
  type(type: TransactionType): void {
    super.type(type);
    this._stakingBuilder = undefined;
  }

  protected getTransactionData(): TxData {
    switch (this._type) {
      case TransactionType.StakingLock:
        return this.buildLockStakeTransaction();
      case TransactionType.StakingUnlock:
      case TransactionType.StakingVote:
      case TransactionType.StakingUnvote:
      case TransactionType.StakingActivate:
      case TransactionType.StakingWithdraw:
        return this.buildStakingTransaction();
    }
    return super.getTransactionData();
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    let tx: Transaction;
    if (/^0x?[0-9a-f]{1,}$/.test(rawTransaction.toLowerCase())) {
      tx = Transaction.fromSerialized(this._coinConfig, this._common, rawTransaction);
      super.loadBuilderInput(tx.toJson());
    } else {
      const txData = JSON.parse(rawTransaction);
      tx = new Transaction(this._coinConfig, this._common, txData);
    }
    return tx;
  }

  protected setTransactionTypeFields(decodedType: TransactionType, transactionJson: TxData): void {
    switch (decodedType) {
      case TransactionType.StakingLock:
        this._stakingBuilder = new StakingBuilder(this._coinConfig)
          .type(StakingOperationTypes.LOCK)
          .amount(transactionJson.value);
        break;
      case TransactionType.StakingUnlock:
      case TransactionType.StakingVote:
      case TransactionType.StakingUnvote:
      case TransactionType.StakingActivate:
      case TransactionType.StakingWithdraw:
        this._stakingBuilder = new StakingBuilder(this._coinConfig, transactionJson.data);
        break;
      default:
        super.setTransactionTypeFields(decodedType, transactionJson);
        break;
    }
  }

  /**
   * Returns the smart contract encoded data
   *
   * @param {string[]} addresses - the contract signers
   * @returns {string} - the smart contract encoded data
   */
  protected getContractData(addresses: string[]): string {
    const params = [addresses];
    const resultEncodedParameters = EthereumAbi.rawEncode(walletSimpleConstructor, params)
      .toString('hex')
      .replace('0x', '');
    return walletSimpleByteCode + resultEncodedParameters;
  }

  // region Stake methods

  /**
   * Gets the staking lock builder if exist, or creates a new one for this transaction and returns it
   * requires: amount
   *
   * @returns {StakingBuilder} the staking builder
   */
  lock(): StakingBuilder {
    if (this._type !== TransactionType.StakingLock) {
      throw new BuildTransactionError('Lock can only be set for Staking Lock transactions type');
    }

    return this.getBuilder(StakingOperationTypes.LOCK);
  }

  /**
   * Gets the staking vote builder if exist, or creates a new one for this transaction and returns it
   * requires: group, lesser, greater, amount
   *
   * @returns {StakingBuilder} the staking builder
   */
  vote(): StakingBuilder {
    if (this._type !== TransactionType.StakingVote) {
      throw new BuildTransactionError('Votes can only be set for a staking transaction');
    }

    return this.getBuilder(StakingOperationTypes.VOTE);
  }

  /**
   * Gets the staking activate builder if exist, or creates a new one for this transaction and returns it
   * requires: group
   *
   * @returns {StakingBuilder} the staking builder
   */
  activate(): StakingBuilder {
    if (this._type !== TransactionType.StakingActivate) {
      throw new BuildTransactionError('Activation can only be set for a staking transaction');
    }

    return this.getBuilder(StakingOperationTypes.ACTIVATE);
  }

  /**
   * Gets the staking unlock builder if exist, or creates a new one for this transaction and returns it
   * requires: amount
   *
   * @returns {StakingBuilder} the staking builder
   */
  unlock(): StakingBuilder {
    if (this._type !== TransactionType.StakingUnlock) {
      throw new BuildTransactionError('Unlock can only be set for Staking Unlock transactions type');
    }

    return this.getBuilder(StakingOperationTypes.UNLOCK);
  }

  /**
   * Gets the staking unvote builder if exist, or creates a new one for this transaction and returns it
   * requires: group, lesser, greater, amount, index
   *
   * @returns {StakingBuilder} the staking builder
   */
  unvote(): StakingBuilder {
    if (this._type !== TransactionType.StakingUnvote) {
      throw new BuildTransactionError('Unvote can only be set for a staking transaction');
    }

    return this.getBuilder(StakingOperationTypes.UNVOTE);
  }

  /**
   * Gets the staking withdraw builder if exist, or creates a new one for this transaction and returns it
   * requires: index (unlock list)
   *
   * @returns {StakingBuilder} the staking builder
   */
  withdraw(): StakingBuilder {
    if (this._type !== TransactionType.StakingWithdraw) {
      throw new BuildTransactionError('Withdraw can only be set for a staking transaction');
    }

    return this.getBuilder(StakingOperationTypes.WITHDRAW);
  }

  /** @inheritdoc */
  transfer(data?: string): TransferBuilder {
    if (this._type !== TransactionType.Send) {
      throw new BuildTransactionError('Transfers can only be set for send transactions');
    }
    if (!this._transfer) {
      this._transfer = new TransferBuilder(data);
    }
    return this._transfer;
  }

  /**
   * Get the appropriate builder for the selected type
   *
   * @param {StakingOperationTypes} type the selected type for the staking builder
   * @returns {StakingBuilder} the staking builder for the selected type
   */
  private getBuilder(type: StakingOperationTypes): StakingBuilder {
    if (!this._stakingBuilder) {
      this._stakingBuilder = new StakingBuilder(this._coinConfig).type(type);
    }

    return this._stakingBuilder;
  }

  private getStaking(): StakingCall {
    if (!this._stakingBuilder) {
      throw new BuildTransactionError('No staking information set');
    }
    return this._stakingBuilder.build();
  }

  private buildLockStakeTransaction(): TxData {
    const stake = this.getStaking();
    const data = this.buildBase(stake.serialize());
    data.to = stake.address;
    data.value = stake.amount;

    return data;
  }

  private buildStakingTransaction(): TxData {
    const stake = this.getStaking();
    const data = this.buildBase(stake.serialize());
    data.to = stake.address;

    return data;
  }

  /**
   * Get the final v value. Final v is described in EIP-155.
   *
   * @protected for internal use when the enableFinalVField flag is true.
   */
  protected getFinalV(): string {
    return addHexPrefix(this._common.chainIdBN().toString(16));
  }

  /**
   * The value to send along with this transaction. 0 by default
   *
   * @param {string} value The value to send along with this transaction
   */
  value(value: string): void {
    this.validatePrecision(value, 'Value');
    this._value = value;
  }

  validatePrecision(value: string, context?: string): void {
    context = context ? context + ' ' : '';
    const valueNumber = Number(value);
    // the Celo library internally converts the string value to a number and converts to hex, which can result in a loss of precision for numbers with >= 15 significant digits
    const valueBigNumber = new BigNumber(valueNumber.toString(16), 16);
    if (isNaN(valueNumber)) {
      throw new BuildTransactionError(`${context}${value} is not a valid number`);
    } else if (!valueBigNumber.isEqualTo(valueNumber)) {
      // TODO(BG-62714): remove this check once the celo library is fixed
      throw new BuildTransactionError(
        `${context}${value} cannot be represented by a JS number, please try using fewer significant digits. We are working to support all values in the future.`
      );
    }
  }
  // endregion
}
