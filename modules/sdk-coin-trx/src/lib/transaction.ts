import { createHash } from 'crypto';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { protocol } from '../../resources/protobuf/tron';
import {
  BaseKey,
  BaseTransaction,
  ExtendTransactionError,
  ParseTransactionError,
  TransactionType,
} from '@bitgo/sdk-core';
import { ContractType } from './enum';
import {
  decodeTransaction,
  decodeDataParams,
  getBase58AddressFromHex,
  tokenMainnetContractAddresses,
  tokenTestnetContractAddresses,
} from './utils';
import { ContractEntry, RawData, TransactionReceipt, TransferContract, TriggerSmartContract } from './iface';

/**
 * Tron transaction model.
 */
export class Transaction extends BaseTransaction {
  // Tron specific fields
  protected _validFrom: number;
  protected _validTo: number;
  protected _inputs: ContractEntry[];
  protected _outputs: ContractEntry[];

  private _decodedRawDataHex: RawData;
  private _transaction?: TransactionReceipt;

  /**
   * Public constructor.
   *
   * @param coinConfig
   * @param rawTransaction
   */
  constructor(coinConfig: Readonly<CoinConfig>, rawTransaction?: TransactionReceipt) {
    super(coinConfig);
    if (rawTransaction) {
      if (!rawTransaction.txID) {
        throw new ParseTransactionError('Transaction has no id');
      }
      this._id = rawTransaction.txID;
      this._transaction = rawTransaction;
      this._decodedRawDataHex = decodeTransaction(rawTransaction.raw_data_hex);

      // Destination depends on the contract type
      this.recordRawDataFields(this._decodedRawDataHex);
    }
  }

  /**
   * Parse the transaction raw data and record the most important fields.
   *
   * @param rawData Object from a tron transaction
   */
  private recordRawDataFields(rawData: RawData) {
    // Contract-agnostic fields
    this._validFrom = rawData.timestamp;
    this._validTo = rawData.expiration;

    let output: ContractEntry, input: ContractEntry;
    // Contract-specific fields
    switch (rawData.contractType) {
      case ContractType.Transfer:
        this._type = TransactionType.Send;
        const value = new BigNumber((rawData.contract[0] as TransferContract).parameter.value.amount).toFixed(0);
        output = {
          address: (rawData.contract[0] as TransferContract).parameter.value.to_address,
          value,
        };
        input = {
          address: (rawData.contract[0] as TransferContract).parameter.value.owner_address,
          value,
        };
        break;
      case ContractType.AccountPermissionUpdate:
        this._type = TransactionType.WalletInitialization;
        output = {
          address: (rawData.contract as any).owner_address,
          value: '0',
        };
        input = {
          address: (rawData.contract as any).owner_address,
          value: '0',
        };
        break;
      case ContractType.TriggerSmartContract:
        this._type = TransactionType.ContractCall;
        const contractCallValues = (rawData.contract[0] as TriggerSmartContract).parameter.value;
        const contractAddress = contractCallValues.contract_address;
        if (
          tokenMainnetContractAddresses.includes(contractAddress) ||
          tokenTestnetContractAddresses.includes(contractAddress)
        ) {
          // this is then a token smart contract transaction and the data must be decoded
          const types = ['address', 'uint256'];
          const data = Buffer.from(contractCallValues.data, 'base64').toString('hex');
          const decodedData = decodeDataParams(types, data);
          const recipient_address = getBase58AddressFromHex(decodedData[0]);
          const value = decodedData[1].toString();
          output = {
            address: recipient_address,
            value,
          };
          input = {
            address: contractCallValues.owner_address,
            contractAddress,
            data,
            value,
          };
          break;
        }
        output = {
          address: contractCallValues.owner_address,
          value: '0',
        };
        input = {
          address: contractCallValues.owner_address,
          contractAddress,
          data: contractCallValues.data,
          value: '0',
        };
        break;
      default:
        throw new ParseTransactionError('Unsupported contract type');
    }
    this._inputs = [input];
    this._outputs = [output];
  }

  /**
   * Recalculate and update the transaction id. This should be done after changing any transaction
   * field since the the id is a hash of the transaction body.
   */
  private updateId(): void {
    if (!this._transaction) {
      throw new ParseTransactionError('Empty transaction');
    }
    const hexBuffer = Buffer.from(this._transaction.raw_data_hex, 'hex');
    const newTxid = createHash('sha256').update(hexBuffer).digest('hex');
    this._transaction.txID = newTxid;
    this._id = newTxid;
  }

  /**
   * Extend the expiration date by the given number of milliseconds.
   *
   * @param extensionMs The number of milliseconds to extend the expiration by
   */
  extendExpiration(extensionMs: number): void {
    if (extensionMs < 0) {
      throw new ExtendTransactionError('Invalid extension range. Must be positive a integer');
    }

    if (!this._transaction) {
      throw new ExtendTransactionError('Empty transaction');
    }

    if (this._transaction.signature && this._transaction.signature.length > 0) {
      throw new ExtendTransactionError('Cannot extend a signed transaction');
    }

    const rawDataHex = this._transaction.raw_data_hex;
    const bytes = Buffer.from(rawDataHex, 'hex');
    let raw;
    try {
      raw = protocol.Transaction.raw.decode(bytes);
      const newExpiration = new BigNumber(raw.expiration).plus(extensionMs).toNumber();
      raw.expiration = newExpiration;
      const newRawDataHex = Buffer.from(protocol.Transaction.raw.encode(raw).finish()).toString('hex');
      // Set the internal variables to account for the new expiration date
      this._transaction.raw_data_hex = newRawDataHex;
      this._transaction.raw_data.expiration = newExpiration;
      this._decodedRawDataHex = decodeTransaction(newRawDataHex);
      this.recordRawDataFields(this._decodedRawDataHex);
      this.updateId();
    } catch (e) {
      throw new ExtendTransactionError('There was an error decoding the initial raw_data_hex from the serialized tx.');
    }
  }

  /**
   * Get the signatures associated with this transaction.
   */
  get signature(): string[] {
    if (this._transaction && this._transaction.signature) {
      return this._transaction.signature;
    }
    return [];
  }
  /**
   * Get the time in milliseconds this transaction becomes valid and can be broadcasted to the
   * network.
   */
  get validFrom(): number {
    return this._validFrom;
  }

  /**
   * Get the expiration time in milliseconds.
   */
  get validTo(): number {
    return this._validTo;
  }

  /** @inheritdoc */
  get outputs(): ContractEntry[] {
    return this._outputs;
  }

  /** @inheritdoc */
  get inputs(): ContractEntry[] {
    return this._inputs;
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    // Tron transaction do not contain the owners account address so it is not possible to check the
    // private key with any but the account main address. This is not enough to fail this check, so
    // it is a no-op.
    return true;
  }

  /**
   * Sets this transaction
   *
   * @param {Transaction} tx transaction
   */
  setTransactionReceipt(tx: TransactionReceipt) {
    this._transaction = tx;
    this.updateId();
  }

  /**
   * Set the transaction type
   *
   * @param {TransactionType} transactionType The transaction type to be set
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /** @inheritdoc */
  toJson(): TransactionReceipt {
    if (!this._transaction) {
      throw new ParseTransactionError('Empty transaction');
    }
    return this._transaction;
  }

  /** @inheritdoc */
  toBroadcastFormat(): any {
    return JSON.stringify(this.toJson());
  }
}
