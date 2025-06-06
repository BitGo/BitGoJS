import { createHash } from 'crypto';
import { BaseCoin as CoinConfig, TronNetwork } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { protocol } from '../../resources/protobuf/tron';
import {
  BaseKey,
  BuildTransactionError,
  ExtendTransactionError,
  InvalidParameterValueError,
  SigningError,
  TransactionType,
} from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Address } from './address';
import { Transaction } from './transaction';
import { Fee, TransactionReceipt, TriggerSmartContract } from './iface';
import {
  decodeTransaction,
  getBase58AddressFromHex,
  getByteArrayFromHexAddress,
  getHexAddressFromBase58Address,
  isValidHex,
  TRANSACTION_MAX_EXPIRATION,
  TRANSACTION_DEFAULT_EXPIRATION,
} from './utils';

import ContractType = protocol.Transaction.Contract.ContractType;
export const MAX_FEE = 5000000000; // 5e9 = 5000 TRX acording https://developers.tron.network/docs/setting-a-fee-limit-on-deployexecution

export class ContractCallBuilder extends TransactionBuilder {
  protected _signingKeys: BaseKey[];
  private _toContractAddress: string;
  private _data: string;
  private _fee: Fee;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._signingKeys = [];
    this.transaction = new Transaction(_coinConfig);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.createTransaction();
    /** @inheritdoc */
    // This method must be extended on child classes
    if (this._signingKeys.length > 0) {
      this.applySignatures();
    }

    if (!this.transaction.id) {
      throw new BuildTransactionError('A valid transaction must have an id');
    }
    return Promise.resolve(this.transaction);
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

  /**
   * Initialize the transaction builder fields using the transaction data
   *
   * @param {any} rawTransaction the transaction data in a string or JSON format
   * @returns {ContractCallBuilder} the builder with the transaction data set
   */
  initBuilder(rawTransaction: TransactionReceipt | string): this {
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
    this.transaction.setTransactionType(TransactionType.ContractCall);
    const contractCall = rawData.contract[0] as TriggerSmartContract;
    this.initContractCall(contractCall);
    return this;
  }

  /**
   * Initialize the contract call specific data
   *
   * @param {TriggerSmartContract} contractCall object with transfer data
   */
  protected initContractCall(contractCall: TriggerSmartContract): void {
    const { data, owner_address, contract_address } = contractCall.parameter.value;
    if (data) {
      this.data(data);
    }
    if (contract_address) {
      this.to({ address: getBase58AddressFromHex(contract_address) });
    }
    if (owner_address) {
      this.source({ address: getBase58AddressFromHex(owner_address) });
    }
  }

  /**
   * Set the address of the contract to be called,
   *
   * @param {Address} contractAddress the contract address
   * @returns {ContractCallBuilder} the builder with the new parameter set
   */
  to(contractAddress: Address): this {
    this.validateAddress(contractAddress);
    this._toContractAddress = getHexAddressFromBase58Address(contractAddress.address);
    return this;
  }

  /**
   * Set the data with the method call and parameters
   *
   * @param {string} data data encoded on hexa
   * @returns {ContractCallBuilder} the builder with the new parameter set
   */
  data(data: string): this {
    if (!isValidHex(data)) {
      throw new InvalidParameterValueError(data + ' is not a valid hex string.');
    }
    this._data = data;
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
   * Set the fee limit for the transaction
   *
   * @param {Fee} fee the fee limit for the transaction
   * @returns {ContractCallBuilder} the builder with the new parameter set
   */
  fee(fee: Fee): this {
    const feeLimit = new BigNumber(fee.feeLimit);
    const tronNetwork = this._coinConfig.network as TronNetwork;
    if (feeLimit.isNaN() || feeLimit.isLessThan(0) || feeLimit.isGreaterThan(tronNetwork.maxFeeLimit)) {
      throw new InvalidParameterValueError('Invalid fee limit value');
    }
    this._fee = fee;
    return this;
  }

  // endregion

  private createTransaction(): void {
    const rawDataHex = this.getRawDataHex();
    const rawData = decodeTransaction(rawDataHex);
    const contract = rawData.contract[0] as TriggerSmartContract;
    const contractParameter = contract.parameter;
    contractParameter.value.contract_address = this._toContractAddress.toLocaleLowerCase();
    contractParameter.value.owner_address = this._ownerAddress.toLocaleLowerCase();
    contractParameter.value.data = this._data.toLocaleLowerCase();
    contractParameter.type_url = 'type.googleapis.com/protocol.TriggerSmartContract';
    contract.type = 'TriggerSmartContract';
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

  private getRawDataHex(): string {
    const rawContract = {
      ownerAddress: getByteArrayFromHexAddress(this._ownerAddress),
      contractAddress: getByteArrayFromHexAddress(this._toContractAddress),
      data: getByteArrayFromHexAddress(this._data),
    };
    const contractCall = protocol.TriggerSmartContract.fromObject(rawContract);
    const contractBytes = protocol.TriggerSmartContract.encode(contractCall).finish();
    const txContract = {
      type: ContractType.TriggerSmartContract,
      parameter: {
        value: contractBytes,
        type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
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

  private applySignatures(): void {
    if (!this.transaction.inputs) {
      throw new SigningError('Transaction has no inputs');
    }
    this._signingKeys.forEach((key) => this.applySignature(key));
  }

  /** @inheritdoc */
  // Specifically, checks hex underlying transaction hashes to correct transaction ID.
  validateTransaction(transaction: Transaction): void {
    this.validateMandatoryFields();
  }

  /** @inheritdoc */
  validateMandatoryFields() {
    if (!this._data) {
      throw new BuildTransactionError('Missing parameter: data');
    }
    if (!this._ownerAddress) {
      throw new BuildTransactionError('Missing parameter: source');
    }
    if (!this._toContractAddress) {
      throw new BuildTransactionError('Missing parameter: contract address');
    }
    if (!this._refBlockBytes || !this._refBlockHash) {
      throw new BuildTransactionError('Missing block reference information');
    }
    if (!this._fee) {
      throw new BuildTransactionError('Missing fee');
    }
  }
}
