import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import BigNumber from 'bignumber.js';
import { RLP } from 'ethers/utils';
import * as Crypto from '../../utils/crypto';
import { BaseTransaction, BaseTransactionBuilder, TransactionType } from '../baseCoin';
import { BaseAddress, BaseKey } from '../baseCoin/iface';
import { Transaction, TransferBuilder, Utils } from '../eth';
import {
  BuildTransactionError,
  InvalidTransactionError,
  ParseTransactionError,
  SigningError,
} from '../baseCoin/errors';
import { KeyPair } from './keyPair';
import { Fee, SignatureParts, TxData } from './iface';
import {
  calculateForwarderAddress,
  getAddressInitializationData,
  getContractData,
  hasSignature,
  isValidEthAddress,
} from './utils';

const DEFAULT_M = 3;

/**
 * Ethereum transaction builder.
 */
export class TransactionBuilder extends BaseTransactionBuilder {
  protected _type: TransactionType;
  private _transaction: Transaction;
  private _sourceKeyPair: KeyPair;
  private _chainId: number;
  private _counter: number;
  private _fee: Fee;

  // the signature on the external ETH transaction
  private _txSignature: SignatureParts;

  // Wallet initialization transaction parameters
  private _walletOwnerAddresses: string[];

  // Send and AddressInitialization transaction specific parameters
  private _transfer: TransferBuilder;
  private _contractAddress: string;
  private _contractCounter: number;

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
    const transactionData = this.getTransactionData();

    if (this._txSignature) {
      Object.assign(transactionData, this._txSignature);
    }

    this.transaction.setTransactionType(this._type);
    transactionData.from = this._sourceKeyPair ? this._sourceKeyPair.getAddress() : undefined;
    this.transaction.setTransactionData(transactionData);

    // Build and sign a new transaction based on the latest changes
    if (this._sourceKeyPair && this._sourceKeyPair.getKeys().prv) {
      await this.transaction.sign(this._sourceKeyPair);
    }
    return this.transaction;
  }

  protected getTransactionData(): TxData {
    switch (this._type) {
      case TransactionType.WalletInitialization:
        return this.buildWalletInitializationTransaction();
      case TransactionType.Send:
        return this.buildSendTransaction();
      case TransactionType.AddressInitialization:
        return this.buildAddressInitializationTransaction();
      default:
        throw new BuildTransactionError('Unsupported transaction type');
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    let tx: Transaction;
    if (/^0x?[0-9a-f]{1,}$/.test(rawTransaction.toLowerCase())) {
      tx = Transaction.fromSerialized(this._coinConfig, rawTransaction);
      this.loadBuilderInput(tx.toJson());
    } else {
      const txData = JSON.parse(rawTransaction);
      tx = new Transaction(this._coinConfig, txData);
    }
    return tx;
  }

  /**
   * Load the builder data using the deserialized transaction
   *
   * @param {TxData} transactionJson the deserialized transaction json
   */
  protected loadBuilderInput(transactionJson: TxData): void {
    const decodedType = Utils.classifyTransaction(transactionJson.data);
    this.type(decodedType);
    this.fee({ fee: transactionJson.gasPrice, gasLimit: transactionJson.gasLimit });
    this.counter(transactionJson.nonce);
    this.chainId(Number(transactionJson.chainId));
    if (hasSignature(transactionJson)) {
      this._txSignature = { v: transactionJson.v!, r: transactionJson.r!, s: transactionJson.s! };
    }
    this.setTransactionTypeFields(decodedType, transactionJson);
  }

  protected setTransactionTypeFields(decodedType: TransactionType, transactionJson: TxData): void {
    switch (decodedType) {
      case TransactionType.WalletInitialization:
        const owners = Utils.decodeWalletCreationData(transactionJson.data);
        owners.forEach(element => {
          this.owner(element);
        });
        break;
      case TransactionType.Send:
        if (transactionJson.to === undefined) {
          throw new BuildTransactionError('Undefined recipient address');
        }
        this._contractAddress = transactionJson.to;
        this._transfer = new TransferBuilder(transactionJson.data);
        break;
      default:
        throw new BuildTransactionError('Unsupported transaction type');
      //TODO: Add other cases of deserialization
    }
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
      case TransactionType.AddressInitialization:
        if (this._contractAddress === undefined) {
          throw new BuildTransactionError('Invalid transaction: missing contract address');
        }

        if (this._contractCounter === undefined) {
          throw new BuildTransactionError('Invalid transaction: missing contract counter');
        }
        break;
      case TransactionType.StakingLock:
      case TransactionType.StakingUnlock:
      case TransactionType.StakingVote:
      case TransactionType.StakingUnvote:
      case TransactionType.StakingActivate:
      case TransactionType.StakingWithdraw:
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

  protected buildBase(data: string): TxData {
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

  /**
   * Gets the transfer funds builder if exist, or creates a new one for this transaction and returns it
   *
   * @returns {TransferBuilder} the transfer builder
   */
  transfer(): TransferBuilder {
    if (this._type !== TransactionType.Send) {
      throw new BuildTransactionError('Transfers can only be set for send transactions');
    }
    if (!this._transfer) {
      this._transfer = new TransferBuilder();
    }
    return this._transfer;
  }

  /**
   * Returns the serialized sendMultiSig contract method data
   *
   * @returns {string} serialized sendMultiSig data
   */
  private getSendData(): string {
    if (!this._transfer) {
      throw new BuildTransactionError('Missing transfer information');
    }
    return this._transfer.signAndBuild();
  }

  private buildSendTransaction(): TxData {
    const sendData = this.getSendData();
    const tx: TxData = this.buildBase(sendData);
    tx.to = this._contractAddress;
    return tx;
  }
  //endregion

  // region AddressInitialization builder methods

  /**
   * Set the contract transaction nonce to calculate the forwarder address.
   *
   * @param {number} contractCounter The counter to use
   */
  contractCounter(contractCounter: number): void {
    if (contractCounter < 0) {
      throw new BuildTransactionError(`Invalid contract counter: ${contractCounter}`);
    }

    this._contractCounter = contractCounter;
  }

  /**
   * Build a transaction to create a forwarder.
   *
   * @returns {TxData} The Ethereum transaction data
   */
  private buildAddressInitializationTransaction(): TxData {
    const addressInitData = getAddressInitializationData();
    const tx: TxData = this.buildBase(addressInitData);
    tx.to = this._contractAddress;
    tx.deployedAddress = calculateForwarderAddress(this._contractAddress, this._contractCounter);
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
