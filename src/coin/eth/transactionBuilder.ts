import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import BigNumber from 'bignumber.js';
import { RLP } from 'ethers/utils';
import * as Crypto from '../../utils/crypto';
import { BaseTransaction, BaseTransactionBuilder, TransactionType } from '../baseCoin';
import { BaseAddress, BaseKey } from '../baseCoin/iface';
import { Transaction, TransferBuilder, Utils } from '../eth';
import {
  BuildTransactionError,
  SigningError,
  InvalidTransactionError,
  ParseTransactionError,
} from '../baseCoin/errors';
import { KeyPair } from './keyPair';
import { Fee, TxData } from './iface';
import { getContractData, isValidEthAddress } from './utils';

const DEFAULT_M = 3;

/**
 * Ethereum transaction builder.
 */
export class TransactionBuilder extends BaseTransactionBuilder {
  private _transaction: Transaction;
  private _sourceKeyPair: KeyPair;
  private _type: TransactionType;
  private _chainId: number;
  private _counter: number;
  private _fee: Fee;
  private _sourceAddress: string;

  // Wallet initialization transaction parameters
  private _walletOwnerAddresses: string[];

  // Send transaction specific parameters
  private _transfer: TransferBuilder;
  private _contractAddress: string;

  /**
   * Public constructor.
   *
   * @param _coinConfig
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.Send;
    this._counter = 0;
    this._walletOwnerAddresses = [];
    this.transaction = new Transaction(this._coinConfig);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<BaseTransaction> {
    let transactionData;
    switch (this._type) {
      case TransactionType.WalletInitialization:
        transactionData = this.buildWalletInitializationTransaction();
        break;
      case TransactionType.Send:
        transactionData = this.buildSendTransaction();
        break;
      default:
        throw new BuildTransactionError('Unsupported transaction type');
    }
    this.transaction.setTransactionType(this._type);
    this.transaction.setTransactionData(transactionData);

    // Build and sign a new transaction based on the latest changes
    if (this._sourceKeyPair && this._sourceKeyPair.getKeys().prv) {
      await this.transaction.sign(this._sourceKeyPair);
    }
    return this.transaction;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    let tx: Transaction;
    if (/^0x?[0-9a-f]{1,}$/.test(rawTransaction.toLowerCase())) {
      tx = Transaction.fromSerialized(this._coinConfig, rawTransaction);
      const transactionJson = tx.toJson();
      const decodedType = Utils.classifyTransaction(transactionJson.data);
      this.type(decodedType);
      switch (decodedType) {
        case TransactionType.WalletInitialization:
          this.fee({ fee: transactionJson.gasPrice, gasLimit: transactionJson.gasLimit });
          this.counter(transactionJson.nonce);
          this.chainId(Number(transactionJson.chainId));
          this._walletOwnerAddresses = Utils.decodeWalletCreationData(transactionJson.data);
          break;
        //TODO: Add other cases of deserialization
      }
    } else {
      const txData = JSON.parse(rawTransaction);
      tx = new Transaction(this._coinConfig, txData);
    }
    return tx;
  }

  /**@inheritdoc */
  protected signImplementation(key: BaseKey): BaseTransaction {
    const signer = new KeyPair({ prv: key.key });
    if (this._type === TransactionType.WalletInitialization && this._walletOwnerAddresses.length === 0) {
      throw new SigningError('Cannot sign an wallet initialization transaction without owners');
    }
    if (this._sourceKeyPair) {
      throw new SigningError('Cannot sign multiple times a non send-type transaction');
    }
    // Signing the transaction is an async operation, so save the source and leave the actual
    // signing for the build step
    this._sourceKeyPair = signer;
    return this.transaction;
  }

  /** @inheritdoc */
  validateAddress(address: BaseAddress): void {
    if (!isValidEthAddress(address.address)) {
      throw new BuildTransactionError('Invalid address ' + address.address);
    }
  }

  /**@inheritdoc */
  validateKey(key: BaseKey): void {
    if (!(Crypto.isValidXprv(key.key) || Crypto.isValidPrv(key.key))) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /**
   * Validate the raw transaction is either a JSON or
   * a hex encoded transaction
   *
   * @param {any} rawTransaction The raw transaction to be validated
   */
  validateRawTransaction(rawTransaction: any): void {
    if (!rawTransaction) {
      throw new InvalidTransactionError('Raw transaction is empty');
    }
    if (typeof rawTransaction === 'string') {
      if (/^0x?[0-9a-f]{1,}$/.test(rawTransaction.toLowerCase())) {
        try {
          RLP.decode(rawTransaction);
        } catch (e) {
          throw new ParseTransactionError('There was error in decoding the hex string');
        }
      } else {
        try {
          JSON.parse(rawTransaction);
        } catch (e) {
          throw new ParseTransactionError('There was error in parsing the JSON string');
        }
      }
    } else {
      throw new InvalidTransactionError('Transaction is not a hex string or stringified json');
    }
  }

  protected validateBaseTransactionFields(): void {
    if (this._fee === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing fee');
    }
    if (this._chainId === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing chain id');
    }
    if (this._counter === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing address counter');
    }
    if (!this._sourceAddress) {
      throw new BuildTransactionError('Invalid transaction: missing source');
    }
  }

  /**@inheritdoc */
  validateTransaction(transaction: BaseTransaction): void {
    this.validateBaseTransactionFields();
    switch (this._type) {
      case TransactionType.WalletInitialization:
        // assume sanitization happened in the builder function, just check that all required fields are set
        if (this._walletOwnerAddresses === undefined) {
          throw new BuildTransactionError('Invalid transaction: missing wallet owners');
        }

        if (this._walletOwnerAddresses.length !== 3) {
          throw new BuildTransactionError(
            `Invalid transaction: wrong number of owners -- required: 3, ` +
              `found: ${this._walletOwnerAddresses.length}`,
          );
        }
        break;
      case TransactionType.Send:
        if (this._contractAddress === undefined) {
          throw new BuildTransactionError('Invalid transaction: missing contract address');
        }
        break;
      default:
        throw new BuildTransactionError('Unsupported transaction type');
    }
  }

  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be below less than zero');
    }
    // TODO: validate the amount is not bigger than the max amount in each Eth family coin
  }

  // region Common builder methods
  /**
   * Set the transaction chain id.
   *
   * @param {number} chainId A block hash to use as branch reference
   */
  chainId(chainId: number): void {
    this._chainId = chainId;
    // TODO: Infer it from coinConfig
  }

  /**
   * The type of transaction being built.
   *
   * @param {TransactionType} type
   */
  type(type: TransactionType): void {
    this._type = type;
  }

  /**
   * Set the transaction fees. Low fees may get a transaction rejected or never picked up by bakers.
   *
   * @param {Fee} fee Baker fees. May also include the maximum gas to pay
   */
  fee(fee: Fee): void {
    this.validateValue(new BigNumber(fee.fee));
    if (fee.gasLimit) {
      this.validateValue(new BigNumber(fee.gasLimit));
    }
    this._fee = fee;
  }

  /**
   * Set the transaction counter to prevent submitting repeated transactions.
   *
   * @param {number} counter The counter to use
   */
  counter(counter: number): void {
    if (counter < 0) {
      throw new BuildTransactionError(`Invalid counter: ${counter}`);
    }

    this._counter = counter;
  }

  /**
   * Set the transaction initiator. This account will pay for the transaction fees, but it will not
   * be added as an owner of a wallet in a init transaction, unless manually set as one of the
   * owners.
   *
   * @param {string} source An Ethereum compatible address
   */
  source(source: string): void {
    this.validateAddress({ address: source });
    this._sourceAddress = source;
  }

  private buildBase(data: string): TxData {
    return {
      gasLimit: this._fee.gasLimit,
      gasPrice: this._fee.fee,
      nonce: this._counter,
      data: data,
      chainId: this._chainId.toString(),
      value: '0',
    };
  }
  // endregion

  // region WalletInitialization builder methods
  /**
   * Set one of the owners of the multisig wallet.
   *
   * @param {string} address An Ethereum address
   */
  owner(address: string): void {
    if (this._type !== TransactionType.WalletInitialization) {
      throw new BuildTransactionError('Multisig wallet owner can only be set for initialization transactions');
    }
    if (this._walletOwnerAddresses.length >= DEFAULT_M) {
      throw new BuildTransactionError('A maximum of ' + DEFAULT_M + ' owners can be set for a multisig wallet');
    }
    if (!isValidEthAddress(address)) {
      throw new BuildTransactionError('Invalid address: ' + address);
    }
    if (this._walletOwnerAddresses.includes(address)) {
      throw new BuildTransactionError('Repeated owner address: ' + address);
    }
    this._walletOwnerAddresses.push(address);
  }

  /**
   * Build a transaction for a generic multisig contract.
   *
   * @returns {TxData} The Ethereum transaction data
   */
  private buildWalletInitializationTransaction(): TxData {
    return this.buildBase(getContractData(this._walletOwnerAddresses));
  }
  //endregion

  // region Send builder methods

  contract(address: string): void {
    if (isValidEthAddress(address)) this._contractAddress = address;
    else throw new BuildTransactionError('Invalid address: ' + address);
  }

  transfer(amount: string): TransferBuilder {
    if (this._type === TransactionType.Send) {
      this._transfer = new TransferBuilder().amount(amount);
      return this._transfer;
    }
    throw new BuildTransactionError('Transfers can only be set for send transactions');
  }

  private getSendData(): string {
    if (this._transfer) return this._transfer.signAndBuild();
    throw new BuildTransactionError('Missing transfer information');
  }

  private buildSendTransaction(): TxData {
    const sendData = this.getSendData();
    const tx: TxData = this.buildBase(sendData);
    tx.to = this._contractAddress;
    return tx;
  }
  //endregion

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }
}
