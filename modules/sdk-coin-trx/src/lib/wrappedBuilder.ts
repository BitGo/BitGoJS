import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseKey, BaseTransaction, InvalidTransactionError } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { Address } from './address';
import { TransactionBuilder } from './transactionBuilder';
import { KeyPair } from './keyPair';
import { decodeTransaction } from './utils';
import { ContractType } from './enum';
import { ContractCallBuilder } from './contractCallBuilder';
import { TransactionReceipt } from './iface';
import { TokenTransferBuilder } from './tokenTransferBuilder';
import { FreezeBalanceTxBuilder } from './freezeBalanceTxBuilder';
import { VoteWitnessTxBuilder } from './voteWitnessTxBuilder';
import { UnfreezeBalanceTxBuilder } from './unfreezeBalanceTxBuilder';
import { WithdrawExpireUnfreezeTxBuilder } from './withdrawExpireUnfreezeTxBuilder';
import { DelegateResourceTxBuilder } from './delegateResourceTxBuilder';

/**
 * Wrapped Builder class
 * This builder is created to maintain compatibility with the current uses of account-lib
 * It has an instance of Transaction Builder or Contract Call Builder as required.
 */
export class WrappedBuilder extends TransactionBuilder {
  private _builder: TransactionBuilder;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    // defaults to old builder
    this._builder = new TransactionBuilder(_coinConfig);
  }

  /**
   * Returns a specific builder to create a contract call transaction
   *
   * @param {Transaction} [tx] The transaction to initialize builder
   * @returns {ContractCallBuilder} The specific contract call builder
   */
  getContractCallBuilder(tx?: TransactionReceipt | string): ContractCallBuilder {
    return this.initializeBuilder(tx, new ContractCallBuilder(this._coinConfig));
  }

  getTransactionBuilder(tx?: TransactionReceipt | string): TransactionBuilder {
    return this.initializeBuilder(tx, new TransactionBuilder(this._coinConfig));
  }

  getTokenTransferBuilder(tx?: TransactionReceipt | string): TokenTransferBuilder {
    return this.initializeBuilder(tx, new TokenTransferBuilder(this._coinConfig));
  }

  /**
   * Returns a specific builder to create a freeze balance transaction
   *
   * @param {TransactionReceipt} transaction - The transaction to initialize builder
   * @returns {FreezeBalanceTxBuilder} The specific freeze balance builder
   */
  getFreezeBalanceV2TxBuilder(tx?: TransactionReceipt | string): FreezeBalanceTxBuilder {
    return this.initializeBuilder(tx, new FreezeBalanceTxBuilder(this._coinConfig));
  }

  /**
   * Returns a specific builder to create a vote witness transaction
   *
   * @param {TransactionReceipt} transaction - The transaction to initialize builder
   * @returns {VoteWitnessTxBuilder} The specific vote witness builder
   */
  getVoteWitnessTxBuilder(tx?: TransactionReceipt | string): VoteWitnessTxBuilder {
    return this.initializeBuilder(tx, new VoteWitnessTxBuilder(this._coinConfig));
  }

  /**
   * Returns a specific builder to create an unfreeze balance transaction
   *
   * @param {Transaction} [tx] The transaction to initialize builder
   * @returns {UnfreezeBalanceTxBuilder} The specific unfreeze builder
   */
  getUnfreezeBalanceV2TxBuilder(tx?: TransactionReceipt | string): UnfreezeBalanceTxBuilder {
    return this.initializeBuilder(tx, new UnfreezeBalanceTxBuilder(this._coinConfig));
  }

  /**
   * Returns a specific builder to create a withdraw expire unfreeze transaction
   *
   * @param {Transaction} [tx] The transaction to initialize builder
   * @returns {WithdrawExpireUnfreezeTxBuilder} The specific withdraw builder
   */
  getWithdrawExpireUnfreezeTxBuilder(tx?: TransactionReceipt | string): WithdrawExpireUnfreezeTxBuilder {
    return this.initializeBuilder(tx, new WithdrawExpireUnfreezeTxBuilder(this._coinConfig));
  }

  /**
   * Returns a specific builder to create a delegate resource transaction
   *
   * @param {TransactionReceipt | string} [tx] The transaction to initialize builder
   * @returns {DelegateResourceTxBuilder} The specific delegate resource builder
   */
  getDelegateResourceTxBuilder(tx?: TransactionReceipt | string): DelegateResourceTxBuilder {
    return this.initializeBuilder(tx, new DelegateResourceTxBuilder(this._coinConfig));
  }

  private initializeBuilder<T extends TransactionBuilder>(tx: TransactionReceipt | string | undefined, builder: T): T {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }

  /** @inheritdoc */
  extendValidTo(extensionMs: number) {
    this._builder.extendValidTo(extensionMs);
  }

  /** @inheritdoc */
  sign(key: BaseKey) {
    this._builder.sign(key);
  }

  /** @inheritdoc */
  async build(): Promise<BaseTransaction> {
    return this._builder.build();
  }

  /** @inheritdoc */
  from(raw: any) {
    this.validateRawTransaction(raw);
    const rawDataHex = this.getTxReceipt(raw);
    const decodedTx = decodeTransaction(rawDataHex);
    const contractType = decodedTx.contractType;
    switch (contractType) {
      case ContractType.Transfer:
      case ContractType.AccountPermissionUpdate:
        this._builder = this.getTransactionBuilder(raw);
        return this._builder;
      case ContractType.TriggerSmartContract:
        return this.getContractCallBuilder(raw);
      case ContractType.FreezeBalanceV2:
        return this.getFreezeBalanceV2TxBuilder(raw);
      case ContractType.VoteWitness:
        return this.getVoteWitnessTxBuilder(raw);
      case ContractType.UnfreezeBalanceV2:
        return this.getUnfreezeBalanceV2TxBuilder(raw);
      case ContractType.WithdrawExpireUnfreeze:
        return this.getWithdrawExpireUnfreezeTxBuilder(raw);
      case ContractType.DelegateResourceContract:
        return this.getDelegateResourceTxBuilder(raw);
      default:
        throw new InvalidTransactionError('Invalid transaction type: ' + contractType);
    }
  }

  /**
   * Get the raw data hex from a raw transaction
   *
   * @param {string | { [key: string]: any }} raw the raw transaction as a string or as an object
   * @returns {string} the raw data hex
   */
  private getTxReceipt(raw: string | { [key: string]: any }): string {
    return raw['raw_data_hex'] || this.getTxReceipt(JSON.parse(raw as string));
  }

  /** @inheritdoc */
  validateAddress(address: Address): void {
    this._builder.validateAddress(address);
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    try {
      new KeyPair({ prv: key.key });
    } catch (err) {
      throw new Error('The provided key is not valid');
    }
  }
  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    this._builder.validateRawTransaction(rawTransaction);
  }

  /** @inheritdoc */
  validateTransaction(transaction: Transaction): void {
    this._builder.validateTransaction(transaction);
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    this._builder.validateValue(value);
  }
}
