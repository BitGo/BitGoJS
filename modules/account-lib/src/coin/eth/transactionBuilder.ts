import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import EthereumCommon from 'ethereumjs-common';
import EthereumAbi from 'ethereumjs-abi';
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
  flushTokensData,
  getAddressInitializationData,
  getCommon,
  hasSignature,
  isValidEthAddress,
} from './utils';
import { walletSimpleByteCode, walletSimpleConstructor } from './walletUtil';

const DEFAULT_M = 3;

/**
 * Ethereum transaction builder.
 */
export class TransactionBuilder extends BaseTransactionBuilder {
  protected _type: TransactionType;
  protected _common: EthereumCommon;
  private _transaction: Transaction;
  private _sourceKeyPair: KeyPair;
  private _counter: number;
  private _fee: Fee;
  private _value: string;

  // the signature on the external ETH transaction
  private _txSignature: SignatureParts;

  // Wallet initialization transaction parameters
  private _walletOwnerAddresses: string[];

  // flush tokens parameters
  private _forwarderAddress: string;
  private _tokenAddress: string;

  // Send and AddressInitialization transaction specific parameters
  protected _transfer: TransferBuilder;
  private _contractAddress: string;
  private _contractCounter: number;

  /**
   * Public constructor.
   *
   * @param _coinConfig
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._common = getCommon(this._coinConfig.network.type);
    this._type = TransactionType.Send;
    this._counter = 0;
    this._value = '0';
    this._walletOwnerAddresses = [];
    this.transaction = new Transaction(this._coinConfig, this._common);
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
      case TransactionType.FlushTokens:
        return this.buildFlushTokensTransaction();
      case TransactionType.SingleSigSend:
        return this.buildBase('0x');
      default:
        throw new BuildTransactionError('Unsupported transaction type');
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    let tx: Transaction;
    if (/^0x?[0-9a-f]{1,}$/.test(rawTransaction.toLowerCase())) {
      tx = Transaction.fromSerialized(this._coinConfig, this._common, rawTransaction);
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
    this.value(transactionJson.value);
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
      case TransactionType.FlushTokens:
        if (transactionJson.to === undefined) {
          throw new BuildTransactionError('Undefined recipient address');
        }
        // the address of the wallet contract that we are calling "flushForwarderTokens" on
        this.contract(transactionJson.to);
        const { forwarderAddress, tokenAddress } = Utils.decodeFlushTokensData(transactionJson.data);
        this.forwarderAddress(forwarderAddress);
        this.tokenAddress(tokenAddress);
        break;
      case TransactionType.Send:
        if (transactionJson.to === undefined) {
          throw new BuildTransactionError('Undefined recipient address');
        }
        this.contract(transactionJson.to);
        this._transfer = this.transfer(transactionJson.data);
        break;
      case TransactionType.AddressInitialization:
        if (transactionJson.to === undefined) {
          throw new BuildTransactionError('Undefined recipient address');
        }
        this.contract(transactionJson.to);
        break;
      case TransactionType.SingleSigSend:
        if (transactionJson.to === undefined) {
          throw new BuildTransactionError('Undefined recipient address');
        }
        this.contract(transactionJson.to);
        break;
      default:
        throw new BuildTransactionError('Unsupported transaction type');
      // TODO: Add other cases of deserialization
    }
  }

  /** @inheritdoc */
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

  /** @inheritdoc */
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
    if (this._common === undefined) {
      throw new BuildTransactionError('Invalid transaction: network common');
    }
    if (this._counter === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing address counter');
    }
  }

  /** @inheritdoc */
  validateTransaction(transaction: BaseTransaction): void {
    this.validateBaseTransactionFields();
    switch (this._type) {
      case TransactionType.WalletInitialization:
        this.validateWalletInitializationFields();
        break;
      case TransactionType.Send:
        this.validateContractAddress();
        break;
      case TransactionType.AddressInitialization:
        this.validateContractAddress();
        break;
      case TransactionType.FlushTokens:
        this.validateContractAddress();
        this.validateForwarderAddress();
        this.validateTokenAddress();
        break;
      case TransactionType.SingleSigSend:
        // for single sig sends, the contract address is actually the recipient
        this.validateContractAddress();
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

  /**
   * Check wallet owner addresses for wallet initialization transactions are valid or throw.
   */
  private validateWalletInitializationFields(): void {
    if (this._walletOwnerAddresses === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing wallet owners');
    }

    if (this._walletOwnerAddresses.length !== 3) {
      throw new BuildTransactionError(
        `Invalid transaction: wrong number of owners -- required: 3, found: ${this._walletOwnerAddresses.length}`,
      );
    }
  }

  /**
   * Check if a token address for the tx was defined or throw.
   */
  private validateTokenAddress(): void {
    if (this._tokenAddress === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing token address');
    }
  }

  /**
   * Check if a forwarder address for the tx was defined or throw.
   */
  private validateForwarderAddress(): void {
    if (this._forwarderAddress === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing forwarder address');
    }
  }

  /**
   * Check if a contract address for the wallet was defined or throw.
   */
  private validateContractAddress(): void {
    if (this._contractAddress === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing contract address');
    }
  }

  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be below less than zero');
    }
    // TODO: validate the amount is not bigger than the max amount in each Eth family coin
  }

  //region Common builder methods

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
   * The value to send along with this transaction. 0 by default
   *
   * @param {string} value The value to send along with this transaction
   */
  value(value: string): void {
    this._value = value;
  }

  protected buildBase(data: string): TxData {
    return {
      gasLimit: this._fee.gasLimit,
      gasPrice: this._fee.fee,
      nonce: this._counter,
      data: data,
      chainId: this._common.chainId().toString(),
      value: this._value,
      to: this._contractAddress,
    };
  }
  //endregion

  //region WalletInitialization builder methods
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
  protected buildWalletInitializationTransaction(): TxData {
    return this.buildBase(this.getContractData(this._walletOwnerAddresses));
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
  //endregion

  //region Send builder methods

  contract(address: string): void {
    if (isValidEthAddress(address)) this._contractAddress = address;
    else throw new BuildTransactionError('Invalid address: ' + address);
  }

  /**
   * Gets the transfer funds builder if exist, or creates a new one for this transaction and returns it
   *
   * @param [data] transfer data to initialize the transfer builder with, empty if none given
   * @returns {TransferBuilder} the transfer builder
   */
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

  //region AddressInitialization builder methods

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
    if (this._contractCounter) {
      tx.deployedAddress = calculateForwarderAddress(this._contractAddress, this._contractCounter);
    }
    return tx;
  }
  //endregion

  //region flush methods
  /**
   * Set the forwarder address to flush
   *
   * @param {string} address The address to flush
   */
  forwarderAddress(address: string): void {
    if (!isValidEthAddress(address)) {
      throw new BuildTransactionError('Invalid address: ' + address);
    }
    this._forwarderAddress = address;
  }

  /**
   * Set the address of the ERC20 token contract that we are flushing tokens for
   *
   * @param {string} address the contract address of the token to flush
   */
  tokenAddress(address: string): void {
    if (!isValidEthAddress(address)) {
      throw new BuildTransactionError('Invalid address: ' + address);
    }
    this._tokenAddress = address;
  }

  /**
   * Build a transaction to flush tokens from a forwarder.
   *
   * @returns {TxData} The Ethereum transaction data
   */
  private buildFlushTokensTransaction(): TxData {
    return this.buildBase(flushTokensData(this._forwarderAddress, this._tokenAddress));
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
