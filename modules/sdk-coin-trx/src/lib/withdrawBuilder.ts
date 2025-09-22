import { createHash } from 'crypto';
import {
  TransactionType,
  BaseKey,
  ExtendTransactionError,
  BuildTransactionError,
  SigningError,
} from '@bitgo-beta/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { TransactionReceipt, WithdrawBalanceContract } from './iface';
import { protocol } from '../../resources/protobuf/tron';
import {
  decodeTransaction,
  getByteArrayFromHexAddress,
  getBase58AddressFromHex,
  TRANSACTION_MAX_EXPIRATION,
  TRANSACTION_DEFAULT_EXPIRATION,
} from './utils';

import ContractType = protocol.Transaction.Contract.ContractType;

export class WithdrawBalanceTxBuilder extends TransactionBuilder {
  protected _signingKeys: BaseKey[];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._signingKeys = [];
    this.transaction = new Transaction(_coinConfig);
  }

  /** @inheritdoc */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingClaim;
  }

  /** @inheritdoc */
  extendValidTo(extensionMs: number): void {
    if (this.transaction.signature && this.transaction.signature.length > 0) {
      throw new ExtendTransactionError('Cannot extend a signed transaction');
    }

    if (extensionMs <= 0) {
      throw new Error('Value cannot be below zero');
    }

    if (extensionMs > TRANSACTION_MAX_EXPIRATION) {
      throw new ExtendTransactionError('The expiration cannot be extended more than one year');
    }

    if (this._expiration) {
      this._expiration = this._expiration + extensionMs;
    } else {
      throw new Error('There is not expiration to extend');
    }
  }

  initBuilder(rawTransaction: TransactionReceipt | string): this {
    this.transaction = this.fromImplementation(rawTransaction);
    this.transaction.setTransactionType(this.transactionType);
    this.validateRawTransaction(rawTransaction);
    const tx = this.fromImplementation(rawTransaction);
    this.transaction = tx;
    this._signingKeys = [];
    const rawData = tx.toJson().raw_data;
    this._refBlockBytes = rawData.ref_block_bytes;
    this._refBlockHash = rawData.ref_block_hash;
    this._expiration = rawData.expiration;
    this._timestamp = rawData.timestamp;
    const contractCall = rawData.contract[0] as WithdrawBalanceContract;
    this.initWithdrawBalanceContractCall(contractCall);
    return this;
  }

  /**
   * Initialize the withdraw balance contract call specific data
   *
   * @param {WithdrawBalanceContract} withdrawBalanceContractCall object with freeze txn data
   */
  protected initWithdrawBalanceContractCall(withdrawBalanceContractCall: WithdrawBalanceContract): void {
    const { owner_address } = withdrawBalanceContractCall.parameter.value;
    if (owner_address) {
      this.source({ address: getBase58AddressFromHex(owner_address) });
    }
  }

  protected async buildImplementation(): Promise<Transaction> {
    this.createWithdrawBalanceTransaction();
    /** @inheritdoccreateTransaction */
    // This method must be extended on child classes
    if (this._signingKeys.length > 0) {
      this.applySignatures();
    }

    if (!this.transaction.id) {
      throw new BuildTransactionError('A valid transaction must have an id');
    }
    return Promise.resolve(this.transaction);
  }

  /**
   * Helper method to create the withdraw balance transaction
   */
  private createWithdrawBalanceTransaction(): void {
    const rawDataHex = this.getWithdrawBalanceRawDataHex();
    const rawData = decodeTransaction(rawDataHex);
    const contract = rawData.contract[0] as WithdrawBalanceContract;
    const contractParameter = contract.parameter;
    contractParameter.value.owner_address = this._ownerAddress.toLocaleLowerCase();
    contractParameter.type_url = 'type.googleapis.com/protocol.WithdrawBalanceContract';
    contract.type = 'WithdrawBalanceContract';
    const hexBuffer = Buffer.from(rawDataHex, 'hex');
    const id = createHash('sha256').update(hexBuffer).digest('hex');
    const txRecip: TransactionReceipt = {
      raw_data: rawData,
      raw_data_hex: rawDataHex,
      txID: id,
      signature: this.transaction.signature,
    };
    this.transaction = new Transaction(this._coinConfig, txRecip);
  }

  /**
   * Helper method to get the withdraw expire unfreeze transaction raw data hex
   *
   * @returns {string} the freeze balance transaction raw data hex
   */
  private getWithdrawBalanceRawDataHex(): string {
    const rawContract = {
      ownerAddress: getByteArrayFromHexAddress(this._ownerAddress),
    };
    const withdrawBalanceContract = protocol.WithdrawBalanceContract.fromObject(rawContract);
    const withdrawBalanceContractBytes = protocol.WithdrawBalanceContract.encode(withdrawBalanceContract).finish();
    const txContract = {
      type: ContractType.WithdrawBalanceContract,
      parameter: {
        value: withdrawBalanceContractBytes,
        type_url: 'type.googleapis.com/protocol.WithdrawBalanceContract',
      },
    };
    const raw = {
      refBlockBytes: Buffer.from(this._refBlockBytes, 'hex'),
      refBlockHash: Buffer.from(this._refBlockHash, 'hex'),
      expiration: this._expiration || Date.now() + TRANSACTION_DEFAULT_EXPIRATION,
      timestamp: this._timestamp || Date.now(),
      contract: [txContract],
    };
    const rawTx = protocol.Transaction.raw.create(raw);
    return Buffer.from(protocol.Transaction.raw.encode(rawTx).finish()).toString('hex');
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    if (this._signingKeys.some((signingKey) => signingKey.key === key.key)) {
      throw new SigningError('Duplicated key');
    }
    this._signingKeys.push(key);

    // We keep this return for compatibility but is not meant to be use
    return this.transaction;
  }

  private applySignatures(): void {
    if (!this.transaction.inputs) {
      throw new SigningError('Transaction has no inputs');
    }

    this._signingKeys.forEach((key) => this.applySignature(key));
  }

  /**
   * Validates the transaction
   *
   * @param {Transaction} transaction - The transaction to validate
   * @throws {BuildTransactionError} when the transaction is invalid
   */
  validateTransaction(transaction: Transaction): void {
    this.validateWithdrawBalanceTransactionFields();
  }

  /**
   * Validates if the transaction is a valid withdraw balance transaction
   *
   * @param {TransactionReceipt} transaction - The transaction to validate
   * @throws {BuildTransactionError} when the transaction is invalid
   */
  private validateWithdrawBalanceTransactionFields(): void {
    if (!this._ownerAddress) {
      throw new BuildTransactionError('Missing parameter: source');
    }

    if (!this._refBlockBytes || !this._refBlockHash) {
      throw new BuildTransactionError('Missing block reference information');
    }
  }
}
