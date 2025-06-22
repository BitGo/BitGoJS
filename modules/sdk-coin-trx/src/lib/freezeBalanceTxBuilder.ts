import { createHash } from 'crypto';
import {
  TransactionType,
  BaseKey,
  ExtendTransactionError,
  BuildTransactionError,
  SigningError,
  InvalidParameterValueError,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig, TronNetwork } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { Fee, TransactionReceipt, FreezeBalanceV2Contract } from './iface';
import {
  decodeTransaction,
  getByteArrayFromHexAddress,
  getBase58AddressFromHex,
  TRANSACTION_MAX_EXPIRATION,
  TRANSACTION_DEFAULT_EXPIRATION,
} from './utils';
import { protocol } from '../../resources/protobuf/tron';

import ContractType = protocol.Transaction.Contract.ContractType;
import BigNumber from 'bignumber.js';

export class FreezeBalanceTxBuilder extends TransactionBuilder {
  protected _signingKeys: BaseKey[];
  private _frozenBalance: string;
  private _resource: string;
  private _fee: Fee;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._signingKeys = [];
    this.transaction = new Transaction(_coinConfig);
  }

  /** @inheritdoc */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingActivate;
  }

  /**
   * Set the frozen balance amount
   *
   * @param amount amount in TRX to freeze
   * @returns the builder with the new parameter set
   */
  setFrozenBalance(amount: string): this {
    this._frozenBalance = amount;
    return this;
  }

  /**
   * Set the resource type
   *
   * @param resource resource type to freeze
   * @returns the builder with the new parameter set
   */
  setResource(resource: string): this {
    this.validateResource(resource);
    this._resource = resource;
    return this;
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

  /**
   * Initialize the transaction builder fields using the transaction data
   *
   * @param {TransactionReceipt | string} rawTransaction the transaction data in a string or JSON format
   * @returns {FreezeBalanceTxBuilder} the builder with the transaction data set
   */
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
    this._fee = { feeLimit: rawData.fee_limit!.toString() };
    this.transaction.setTransactionType(TransactionType.StakingActivate);
    const contractCall = rawData.contract[0] as FreezeBalanceV2Contract;
    this.initFreezeContractCall(contractCall);
    return this;
  }

  fee(fee: Fee): this {
    const feeLimit = new BigNumber(fee.feeLimit);
    const tronNetwork = this._coinConfig.network as TronNetwork;
    if (feeLimit.isNaN() || feeLimit.isLessThan(0) || feeLimit.isGreaterThan(tronNetwork.maxFeeLimit)) {
      throw new InvalidParameterValueError('Invalid fee limit value');
    }
    this._fee = fee;
    return this;
  }

  /**
   * Initialize the freeze contract call specific data
   *
   * @param {FreezeBalanceV2Contract} freezeContractCall object with freeze txn data
   */
  protected initFreezeContractCall(freezeContractCall: FreezeBalanceV2Contract): void {
    const { resource, owner_address, frozen_balance } = freezeContractCall.parameter.value;
    if (owner_address) {
      this.source({ address: getBase58AddressFromHex(owner_address) });
    }

    if (resource) {
      this.setResource(resource);
    }

    if (frozen_balance) {
      this.setFrozenBalance(frozen_balance.toString());
    }
  }

  protected async buildImplementation(): Promise<Transaction> {
    this.createFreezeBalanceTransaction();
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
   * Helper method to create the freeze balance transaction
   */
  private createFreezeBalanceTransaction(): void {
    const rawDataHex = this.getFreezeRawDataHex();
    const rawData = decodeTransaction(rawDataHex);
    const contract = rawData.contract[0] as FreezeBalanceV2Contract;
    const contractParameter = contract.parameter;
    contractParameter.value.owner_address = this._ownerAddress.toLocaleLowerCase();
    contractParameter.value.frozen_balance = Number(this._frozenBalance);
    contractParameter.value.resource = this._resource;
    contractParameter.type_url = 'type.googleapis.com/protocol.FreezeBalanceV2Contract';
    contract.type = 'FreezeBalanceV2Contract';
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
   * Helper method to get the freeze balance transaction raw data hex
   *
   * @returns {string} the freeze balance transaction raw data hex
   */
  private getFreezeRawDataHex(): string {
    const rawContract = {
      ownerAddress: getByteArrayFromHexAddress(this._ownerAddress),
      frozenBalance: this._frozenBalance,
      resource: this._resource,
    };
    const freezeContract = protocol.FreezeBalanceV2Contract.fromObject(rawContract);
    const freezeContractBytes = protocol.FreezeBalanceV2Contract.encode(freezeContract).finish();
    const txContract = {
      type: ContractType.FreezeBalanceV2Contract,
      parameter: {
        value: freezeContractBytes,
        type_url: 'type.googleapis.com/protocol.FreezeBalanceV2Contract',
      },
    };
    const raw = {
      refBlockBytes: Buffer.from(this._refBlockBytes, 'hex'),
      refBlockHash: Buffer.from(this._refBlockHash, 'hex'),
      expiration: this._expiration || Date.now() + TRANSACTION_DEFAULT_EXPIRATION,
      timestamp: this._timestamp || Date.now(),
      contract: [txContract],
      feeLimit: parseInt(this._fee.feeLimit, 10),
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
   * @throws {InvalidTransactionError} when the transaction is invalid
   */
  validateTransaction(transaction: Transaction): void {
    this.validateFreezeTransactionFields();
  }

  /**
   * Validates if the transaction is a valid freeze transaction
   *
   * @param {TransactionReceipt} transaction - The transaction to validate
   * @throws {BuildTransactionError} when the transaction is invalid
   */
  private validateFreezeTransactionFields(): void {
    if (!this._frozenBalance) {
      throw new BuildTransactionError('Missing parameter: frozenBalance');
    }

    if (!this._ownerAddress) {
      throw new BuildTransactionError('Missing parameter: source');
    }

    if (!this._resource) {
      throw new BuildTransactionError('Missing parameter: resource');
    }

    if (!this._refBlockBytes || !this._refBlockHash) {
      throw new BuildTransactionError('Missing block reference information');
    }

    if (!this._fee) {
      throw new BuildTransactionError('Missing fee');
    }
  }
}
