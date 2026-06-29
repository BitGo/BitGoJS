import { createHash } from 'crypto';
import { TransactionType, BaseKey, ExtendTransactionError, BuildTransactionError, SigningError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { TransactionReceipt, AccountCreateContract } from './iface';
import { protocol } from '../../resources/protobuf/tron';
import {
  decodeTransaction,
  getByteArrayFromHexAddress,
  getBase58AddressFromHex,
  getHexAddressFromBase58Address,
  TRANSACTION_MAX_EXPIRATION,
  TRANSACTION_DEFAULT_EXPIRATION,
} from './utils';
import { ACCOUNT_CREATE_TYPE_URL } from './constants';

export class AccountCreateTxBuilder extends TransactionBuilder {
  protected _signingKeys: BaseKey[];
  // Stored as hex address, consistent with _ownerAddress
  protected _accountAddress: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._signingKeys = [];
    this.transaction = new Transaction(_coinConfig);
  }

  /** @inheritdoc */
  protected get transactionType(): TransactionType {
    return TransactionType.AccountCreate;
  }

  /**
   * Sets the account address (Base58) to be created/activated on-chain.
   * Stored internally as hex for protobuf encoding.
   *
   * @param {object} address - object containing the Base58 address of the new account
   * @returns {this}
   */
  setAccountAddress(address: { address: string }): this {
    this.validateAddress(address);
    this._accountAddress = getHexAddressFromBase58Address(address.address);
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
      throw new ExtendTransactionError('The expiration cannot be extended more than one day');
    }

    if (this._expiration) {
      this._expiration = this._expiration + extensionMs;
    } else {
      throw new Error('There is not expiration to extend');
    }
  }

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
    this.transaction.setTransactionType(this.transactionType);
    const contractCall = rawData.contract[0] as AccountCreateContract;
    this.initAccountCreateContractCall(contractCall);
    return this;
  }

  /**
   * Initialize the account create contract call specific data.
   * Addresses stored in the receipt are hex (set by createAccountCreateTransaction).
   *
   * @param {AccountCreateContract} accountCreateContractCall object with account create contract data
   */
  protected initAccountCreateContractCall(accountCreateContractCall: AccountCreateContract): void {
    const { owner_address, account_address } = accountCreateContractCall.parameter.value;
    if (owner_address) {
      // owner_address stored in receipt is hex; source() expects Base58
      this.source({ address: getBase58AddressFromHex(owner_address) });
    }
    if (account_address) {
      // account_address stored in receipt is hex; store directly
      this._accountAddress = account_address;
    }
  }

  protected async buildImplementation(): Promise<Transaction> {
    this.createAccountCreateTransaction();
    if (this._signingKeys.length > 0) {
      this.applySignatures();
    }

    if (!this.transaction.id) {
      throw new BuildTransactionError('A valid transaction must have an id');
    }
    return Promise.resolve(this.transaction);
  }

  /**
   * Helper method to create the account create transaction
   */
  private createAccountCreateTransaction(): void {
    const rawDataHex = this.getAccountCreateTxRawDataHex();
    const rawData = decodeTransaction(rawDataHex);
    const contract = rawData.contract[0] as AccountCreateContract;
    const contractParameter = contract.parameter;
    contractParameter.value.owner_address = this._ownerAddress.toLocaleLowerCase();
    contractParameter.value.account_address = this._accountAddress.toLocaleLowerCase();
    contractParameter.type_url = ACCOUNT_CREATE_TYPE_URL;
    contract.type = 'AccountCreateContract';
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
   * Helper method to get the account create transaction raw data hex
   *
   * @returns {string} the account create transaction raw data hex
   */
  private getAccountCreateTxRawDataHex(): string {
    const rawContract = {
      ownerAddress: getByteArrayFromHexAddress(this._ownerAddress),
      accountAddress: getByteArrayFromHexAddress(this._accountAddress),
    };
    const accountCreateContract = protocol.AccountCreateContract.fromObject(rawContract);
    const accountCreateContractBytes = protocol.AccountCreateContract.encode(accountCreateContract).finish();
    // AccountCreateContract is enum value 0 — the proto3 default. TRON's node
    // re-serializes raw_data from broadcast JSON and omits default-valued
    // fields, producing a different raw_data_hex (and txID) than the SDK if
    // we encode the type field explicitly. Skip it so signing and broadcast
    // hashes match. See freezeBalanceTxBuilder.ts:175-181 for the same class
    // of issue on the inner `resource` field.
    const txContract = {
      parameter: {
        value: accountCreateContractBytes,
        type_url: ACCOUNT_CREATE_TYPE_URL,
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
    this.validateAccountCreateTransactionFields();
  }

  /**
   * Validates if the transaction is a valid account create transaction
   *
   * @throws {BuildTransactionError} when the transaction is invalid
   */
  private validateAccountCreateTransactionFields(): void {
    if (!this._ownerAddress) {
      throw new BuildTransactionError('Missing parameter: source');
    }

    if (!this._accountAddress) {
      throw new BuildTransactionError('Missing parameter: account address');
    }

    if (!this._refBlockBytes || !this._refBlockHash) {
      throw new BuildTransactionError('Missing block reference information');
    }
  }
}
