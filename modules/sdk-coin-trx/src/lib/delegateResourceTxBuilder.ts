import { createHash } from 'crypto';
import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { Transaction } from './transaction';
import { TransactionReceipt, ResourceManagementContract } from './iface';
import { decodeTransaction, getByteArrayFromHexAddress, TRANSACTION_DEFAULT_EXPIRATION } from './utils';
import { protocol } from '../../resources/protobuf/tron';
import { DELEGATION_TYPE_URL } from './constants';

import ContractType = protocol.Transaction.Contract.ContractType;
import { ResourceManagementTxBuilder } from './resourceManagementTxBuilder';

export class DelegateResourceTxBuilder extends ResourceManagementTxBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  protected get transactionType(): TransactionType {
    return TransactionType.DelegateResource;
  }

  /**
   * Initialize the transaction builder fields using the transaction data
   *
   * @param {TransactionReceipt | string} rawTransaction the transaction data in a string or JSON format
   * @returns {DelegateResourceTxBuilder} the builder with the transaction data set
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
    this.transaction.setTransactionType(TransactionType.DelegateResource);
    const contractCall = rawData.contract[0] as ResourceManagementContract;
    this.initResourceManagementContractCall(contractCall);
    return this;
  }

  /**
   * Helper method to create the delegate resource transaction
   */
  protected createResourceManagementTransaction(): void {
    const rawDataHex = this.getResourceManagementTxRawDataHex();
    const rawData = decodeTransaction(rawDataHex);
    const contract = rawData.contract[0] as ResourceManagementContract;
    const contractParameter = contract.parameter;
    contractParameter.value.owner_address = this._ownerAddress.toLocaleLowerCase();
    contractParameter.value.balance = Number(this._balance);
    contractParameter.value.receiver_address = this._receiverAddress.toLocaleLowerCase();
    contractParameter.value.resource = this._resource;
    contractParameter.type_url = DELEGATION_TYPE_URL;
    contract.type = 'DelegateResourceContract';
    const hexBuffer = Buffer.from(rawDataHex, 'hex');
    const id = createHash('sha256').update(hexBuffer).digest('hex');
    const txReceipt: TransactionReceipt = {
      raw_data: rawData,
      raw_data_hex: rawDataHex,
      txID: id,
      signature: this.transaction.signature,
    };
    this.transaction = new Transaction(this._coinConfig, txReceipt);
  }

  /**
   * Helper method to get the delegate resource transaction raw data hex
   *
   * @returns {string} the delegate resource transaction raw data hex
   */
  protected getResourceManagementTxRawDataHex(): string {
    const rawContract = {
      ownerAddress: getByteArrayFromHexAddress(this._ownerAddress),
      receiverAddress: getByteArrayFromHexAddress(this._receiverAddress),
      balance: this._balance,
      resource: this._resource,
    };
    const delegateResourceContract = protocol.DelegateResourceContract.fromObject(rawContract);
    const delegateResourceContractBytes = protocol.DelegateResourceContract.encode(delegateResourceContract).finish();
    const txContract = {
      type: ContractType.DelegateResourceContract,
      parameter: {
        value: delegateResourceContractBytes,
        type_url: DELEGATION_TYPE_URL,
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
}
