import { BaseCoin as CoinConfig, EthereumNetwork } from '@bitgo/statics';
import EthereumCommon from '@ethereumjs/common';
import EthereumAbi from 'ethereumjs-abi';
import BigNumber from 'bignumber.js';

import {
  BaseAddress,
  BaseKey,
  BaseTransaction,
  BaseTransactionBuilder,
  BuildTransactionError,
  InvalidTransactionError,
  isValidPrv,
  isValidXprv,
  ParseTransactionError,
  SigningError,
  TransactionType,
} from '@bitgo/sdk-core';
import { Transaction, TransferBuilder, Utils } from '../eth';
import { KeyPair } from './keyPair';
import { ETHTransactionType, Fee, SignatureParts, TxData } from './iface';
import {
  calculateForwarderAddress,
  flushCoinsData,
  flushTokensData,
  getAddressInitializationData,
  getCommon,
  hasSignature,
  isValidEthAddress,
} from './utils';
import { walletSimpleByteCode, walletSimpleConstructor } from './walletUtil';
import * as ethUtil from 'ethereumjs-util';
import { FeeMarketEIP1559Transaction } from '@ethereumjs/tx';
import { ERC1155TransferBuilder } from './transferBuilder/transferBuilderERC1155';
import { ERC721TransferBuilder } from './transferBuilder/transferBuilderERC721';

const DEFAULT_M = 3;

/**
 * Ethereum transaction builder.
 */
export class TransactionBuilder extends BaseTransactionBuilder {
  protected _type: TransactionType;
  // Specifies common chain and hardfork parameters.
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
  protected _transfer: TransferBuilder | ERC721TransferBuilder | ERC1155TransferBuilder;
  private _contractAddress: string;
  private _contractCounter: number;

  // generic contract call builder
  // encoded contract call hex
  private _data: string;

  /**
   * Public constructor.
   *
   * @param _coinConfig
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._common = getCommon(this._coinConfig.network as EthereumNetwork);
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
      case TransactionType.SendERC721:
      case TransactionType.SendERC1155:
        return this.buildSendTransaction();
      case TransactionType.AddressInitialization:
        return this.buildAddressInitializationTransaction();
      case TransactionType.FlushTokens:
        return this.buildFlushTokensTransaction();
      case TransactionType.FlushCoins:
        return this.buildFlushCoinsTransaction();
      case TransactionType.SingleSigSend:
        return this.buildBase('0x');
      case TransactionType.ContractCall:
        return this.buildGenericContractCallTransaction();
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
    this.counter(transactionJson.nonce);
    this.value(transactionJson.value);

    if (transactionJson._type === ETHTransactionType.LEGACY) {
      this.fee({
        fee: transactionJson.gasPrice,
        gasPrice: transactionJson.gasPrice,
        gasLimit: transactionJson.gasLimit,
      });
    } else {
      this.fee({
        gasLimit: transactionJson.gasLimit,
        fee: transactionJson.maxFeePerGas,
        eip1559: {
          maxFeePerGas: transactionJson.maxFeePerGas,
          maxPriorityFeePerGas: transactionJson.maxPriorityFeePerGas,
        },
      });
    }

    if (hasSignature(transactionJson)) {
      this._txSignature = { v: transactionJson.v!, r: transactionJson.r!, s: transactionJson.s! };
    }
    this.setTransactionTypeFields(decodedType, transactionJson);
  }

  protected setTransactionTypeFields(decodedType: TransactionType, transactionJson: TxData): void {
    switch (decodedType) {
      case TransactionType.WalletInitialization:
        const owners = Utils.decodeWalletCreationData(transactionJson.data);
        owners.forEach((element) => {
          this.owner(element);
        });
        break;
      case TransactionType.FlushTokens:
        this.setContract(transactionJson.to);
        const { forwarderAddress, tokenAddress } = Utils.decodeFlushTokensData(transactionJson.data);
        this.forwarderAddress(forwarderAddress);
        this.tokenAddress(tokenAddress);
        break;
      case TransactionType.FlushCoins:
        this.setContract(transactionJson.to);
        break;
      case TransactionType.Send:
      case TransactionType.SendERC1155:
      case TransactionType.SendERC721:
        this.setContract(transactionJson.to);
        this._transfer = this.transfer(transactionJson.data);
        break;
      case TransactionType.AddressInitialization:
        this.setContract(transactionJson.to);
        break;
      case TransactionType.SingleSigSend:
        this.setContract(transactionJson.to);
        break;
      case TransactionType.ContractCall:
        this.setContract(transactionJson.to);
        this.data(transactionJson.data);
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
    if (!(isValidXprv(key.key) || isValidPrv(key.key))) {
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
        const txBytes = ethUtil.toBuffer(ethUtil.addHexPrefix(rawTransaction.toLowerCase()));
        if (!this.isEip1559Txn(txBytes) && !this.isRLPDecodable(txBytes)) {
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

  private isEip1559Txn(txn: Buffer): boolean {
    try {
      FeeMarketEIP1559Transaction.fromSerializedTx(txn);
      return true;
    } catch (_) {
      return false;
    }
  }

  private isRLPDecodable(bytes: Buffer): boolean {
    try {
      ethUtil.rlp.decode(bytes);
      return true;
    } catch (_) {
      return false;
    }
  }

  protected validateBaseTransactionFields(): void {
    if (this._fee === undefined || (!this._fee.fee && !this._fee.gasPrice && !this._fee.eip1559)) {
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
      case TransactionType.SendERC721:
      case TransactionType.SendERC1155:
        this.validateContractAddress();
        break;
      case TransactionType.AddressInitialization:
        this.validateContractAddress();
        break;
      case TransactionType.FlushCoins:
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
      case TransactionType.ContractCall:
        this.validateContractAddress();
        this.validateDataField();
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

  /**
   * Checks if a contract call data field was defined or throws otherwise
   */
  private validateDataField(): void {
    if (!this._data) {
      throw new BuildTransactionError('Invalid transaction: missing contract call data field');
    }
  }

  private setContract(address: string | undefined): void {
    if (address === undefined) {
      throw new BuildTransactionError('Undefined recipient address');
    }
    this.contract(address);
  }

  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be below less than zero');
    }
    // TODO: validate the amount is not bigger than the max amount in each Eth family coin
  }

  // region Common builder methods

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
    if (fee.eip1559) {
      this.validateValue(new BigNumber(fee.eip1559.maxFeePerGas));
      this.validateValue(new BigNumber(fee.eip1559.maxPriorityFeePerGas));
    }
    if (fee.gasPrice) {
      this.validateValue(new BigNumber(fee.gasPrice));
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

  // set args that are required for all types of eth transactions
  protected buildBase(data: string): TxData {
    const baseParams = {
      gasLimit: this._fee.gasLimit,
      nonce: this._counter,
      data: data,
      chainId: this._common.chainIdBN().toString(),
      value: this._value,
      to: this._contractAddress,
    };

    if (this._fee.eip1559) {
      return {
        ...baseParams,
        _type: ETHTransactionType.EIP1559,
        maxFeePerGas: this._fee.eip1559.maxFeePerGas,
        maxPriorityFeePerGas: this._fee.eip1559.maxPriorityFeePerGas,
      };
    } else {
      return {
        ...baseParams,
        _type: ETHTransactionType.LEGACY,
        gasPrice: this._fee?.gasPrice ?? this._fee.fee,
        v: this.getFinalV(),
      };
    }
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
  // endregion

  // region Send builder methods

  contract(address: string): void {
    if (!isValidEthAddress(address)) {
      throw new BuildTransactionError('Invalid address: ' + address);
    }
    this._contractAddress = address;
  }

  /**
   * Gets the transfer funds builder if exist, or creates a new one for this transaction and returns it
   *
   * @param [data] transfer data to initialize the transfer builder with, empty if none given
   * @returns {TransferBuilder} the transfer builder
   */
  transfer(data?: string): TransferBuilder | ERC721TransferBuilder | ERC1155TransferBuilder {
    if (
      !(
        this._type === TransactionType.Send ||
        this._type === TransactionType.SendERC721 ||
        this._type === TransactionType.SendERC1155
      )
    ) {
      throw new BuildTransactionError('Transfers can only be set for send transactions');
    } else if (!this._transfer) {
      if (this._type === TransactionType.Send) {
        this._transfer = new TransferBuilder(data);
      } else if (this._type === TransactionType.SendERC721) {
        this._transfer = new ERC721TransferBuilder(data);
      } else if (this._type === TransactionType.SendERC1155) {
        this._transfer = new ERC1155TransferBuilder(data);
      }
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

  // endregion

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
    if (this._contractCounter) {
      tx.deployedAddress = calculateForwarderAddress(this._contractAddress, this._contractCounter);
    }
    return tx;
  }
  // endregion

  // region flush methods
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

  /**
   * Build a transaction to flush tokens from a forwarder.
   *
   * @returns {TxData} The Ethereum transaction data
   */
  private buildFlushCoinsTransaction(): TxData {
    return this.buildBase(flushCoinsData());
  }
  // endregion

  // region generic contract call
  data(encodedCall: string): void {
    if (this._type !== TransactionType.ContractCall) {
      throw new BuildTransactionError('data can only be set for contract call transaction types');
    }
    this._data = encodedCall;
  }

  private buildGenericContractCallTransaction(): TxData {
    return this.buildBase(this._data);
  }
  // endregion

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  /**
   * Get the final v value. Final v is described in EIP-155.
   *
   * @protected for internal use when the enableFinalVField flag is true.
   */
  protected getFinalV(): string {
    return ethUtil.addHexPrefix(this._common.chainIdBN().muln(2).addn(35).toString(16));
  }
}
