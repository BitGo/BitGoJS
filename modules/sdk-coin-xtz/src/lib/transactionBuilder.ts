import { BaseKey, BuildTransactionError, SigningError, BaseTransactionBuilder, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { Address } from './address';
import { Fee, IndexedData, IndexedSignature, Key, Operation, OriginationOp, RevealOp, TransactionOp } from './iface';
import { KeyPair } from './keyPair';
import {
  forwarderOriginationOperation,
  genericMultisigOriginationOperation,
  multisigTransactionOperation,
  revealOperation,
  singlesigTransactionOperation,
} from './multisigUtils';
import { Transaction } from './transaction';
import { TransferBuilder } from './transferBuilder';
import {
  DEFAULT_GAS_LIMIT,
  DEFAULT_STORAGE_LIMIT,
  isValidAddress,
  isValidBlockHash,
  isValidOriginatedAddress,
  isValidPublicKey,
  sign,
} from './utils';

const DEFAULT_M = 3;

interface DataToSignOverride extends IndexedData {
  dataToSign: string;
}

interface IndexedKeyPair extends IndexedData {
  key: KeyPair;
}

/**
 * Tezos transaction builder.
 */
export class TransactionBuilder extends BaseTransactionBuilder {
  private _serializedTransaction: string;
  private _transaction: Transaction;
  private _type: TransactionType;
  private _blockHeader: string;
  private _counter: BigNumber;
  private _fee: Fee;
  private _sourceAddress: string;
  private _sourceKeyPair?: KeyPair;

  // Public key revelation transaction parameters
  private _publicKeyToReveal: string;

  // Wallet initialization transaction parameters
  private _initialBalance: string;
  private _initialDelegate: string;
  private _walletOwnerPublicKeys: string[];

  // Send transaction parameters
  private _multisigSignerKeyPairs: IndexedKeyPair[];
  private _dataToSignOverride: DataToSignOverride[];
  private _transfers: TransferBuilder[];

  // Address initialization parameters
  private _forwarderDestination: string;

  /**
   * Public constructor.
   *
   * @param {CoinConfig} _coinConfig - coin configuration
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.Send;
    this._counter = new BigNumber(0);
    this._transfers = [];
    this._walletOwnerPublicKeys = [];
    this._multisigSignerKeyPairs = [];
    this._dataToSignOverride = [];
    this.transaction = new Transaction(_coinConfig);
  }

  // region Base Builder
  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    // Decoding the transaction is an async operation, so save it and leave the decoding for the
    // build step
    this._serializedTransaction = rawTransaction;
    return new Transaction(this._coinConfig);
  }

  /** @inheritdoc */
  protected signImplementation(key: Key): Transaction {
    const signer = new KeyPair({ prv: key.key });
    // Currently public key revelation is the only type of account update tx supported in Tezos
    if (this._type === TransactionType.AccountUpdate && !this._publicKeyToReveal) {
      throw new SigningError('Cannot sign a public key revelation transaction without public key');
    }

    if (this._type === TransactionType.WalletInitialization && this._walletOwnerPublicKeys.length === 0) {
      throw new SigningError('Cannot sign an wallet initialization transaction without owners');
    }

    if (
      this._type === TransactionType.Send &&
      this._transfers.length === 0 &&
      this._serializedTransaction === undefined
    ) {
      throw new SigningError('Cannot sign an empty send transaction');
    }

    if (this._type === TransactionType.Send && (!this._sourceAddress || this._sourceAddress !== signer.getAddress())) {
      // If the signer is not the source and it is a send transaction, add it to the list of
      // multisig wallet signers

      // TODO: support a combination of keys with and without custom index
      if (key.index && key.index >= DEFAULT_M) {
        throw new BuildTransactionError(
          'Custom index cannot be greater than the wallet total number of signers (owners)'
        );
      }
      // Make sure either all keys passed have a custom index or none of them have
      const shouldHaveCustomIndex = key.hasOwnProperty('index');
      for (let i = 0; i < this._multisigSignerKeyPairs.length; i++) {
        if (shouldHaveCustomIndex !== (this._multisigSignerKeyPairs[i].index !== undefined)) {
          throw new BuildTransactionError('Custom index has to be set for all multisig contract signing keys or none');
        }
      }
      const multisigSignerKey = shouldHaveCustomIndex ? { key: signer, index: key.index } : { key: signer };
      this._multisigSignerKeyPairs.push(multisigSignerKey);
    } else {
      if (this._sourceKeyPair) {
        throw new SigningError('Cannot sign multiple times a non send-type transaction');
      }
      this._sourceKeyPair = signer;
    }

    // Signing the transaction is an async operation, so save the source and leave the actual
    // signing for the build step
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    // If the from() method was called, use the serialized transaction as a base
    if (this._serializedTransaction) {
      await this.transaction.initFromSerializedTransaction(this._serializedTransaction);
      for (let i = 0; i < this._dataToSignOverride.length; i++) {
        const signatures = await this.getSignatures(this._dataToSignOverride[i].dataToSign);
        await this.transaction.addTransferSignature(signatures, this._dataToSignOverride[i].index || i);
      }
      // TODO: make changes to the transaction if any extra parameter has been set then sign it
    } else {
      let contents: Operation[] = [];
      switch (this._type) {
        case TransactionType.AccountUpdate:
          if (this._publicKeyToReveal) {
            contents.push(this.buildPublicKeyRevelationOperation());
          }
          break;
        case TransactionType.WalletInitialization:
          if (this._publicKeyToReveal) {
            contents.push(this.buildPublicKeyRevelationOperation());
          }
          contents.push(this.buildWalletInitializationOperations());
          break;
        case TransactionType.Send:
          if (this._publicKeyToReveal) {
            contents.push(this.buildPublicKeyRevelationOperation());
          }
          contents = contents.concat(await this.buildSendTransactionContent());
          break;
        case TransactionType.AddressInitialization:
          if (this._publicKeyToReveal) {
            contents.push(this.buildPublicKeyRevelationOperation());
          }
          contents = contents.concat(this.buildForwarderDeploymentContent());
          break;
        case TransactionType.SingleSigSend:
          // No support for revelation txns as primary use case is to send from fee address
          contents = contents.concat(await this.buildSendTransactionContent());
          break;
        default:
          throw new BuildTransactionError('Unsupported transaction type');
      }
      if (contents.length === 0) {
        throw new BuildTransactionError('Empty transaction');
      }
      const parsedTransaction = {
        branch: this._blockHeader,
        contents,
      };

      this.transaction = new Transaction(this._coinConfig);
      // Build and sign a new transaction based on the latest changes
      await this.transaction.initFromParsedTransaction(parsedTransaction);
    }

    if (this._sourceKeyPair && this._sourceKeyPair.getKeys().prv) {
      // TODO: check if there are more signers than needed for a singlesig or multisig transaction
      await this.transaction.sign(this._sourceKeyPair);
    }
    return this.transaction;
  }
  // endregion

  // region Common builder methods
  /**
   * Set the transaction branch id.
   *
   * @param {string} blockId A block hash to use as branch reference
   */
  branch(blockId: string): void {
    if (!isValidBlockHash(blockId)) {
      throw new BuildTransactionError('Invalid block hash ' + blockId);
    }
    this._blockHeader = blockId;
  }

  /**
   * The type of transaction being built.
   *
   * @param {TransactionType} type - type of the transaction
   */
  type(type: TransactionType): void {
    if (type === TransactionType.Send && this._walletOwnerPublicKeys.length > 0) {
      throw new BuildTransactionError('Transaction cannot be labeled as Send when owners have already been set');
    }
    if (type !== TransactionType.Send && this._transfers.length > 0) {
      throw new BuildTransactionError('Transaction contains transfers and can only be labeled as Send');
    }
    this._type = type;
  }

  /**
   * Set the transaction fees. Low fees may get a transaction rejected or never picked up by bakers.
   *
   * @param {Fee} fee Baker fees. May also include the maximum gas and storage fees to pay
   */
  fee(fee: Fee): void {
    this.validateValue(new BigNumber(fee.fee));
    if (fee.gasLimit) {
      this.validateValue(new BigNumber(fee.gasLimit));
    }
    if (fee.storageLimit) {
      this.validateValue(new BigNumber(fee.storageLimit));
    }
    this._fee = fee;
  }

  /**
   * Set the transaction initiator. This account will pay for the transaction fees, but it will not
   * be added as an owner of a wallet in a init transaction, unless manually set as one of the
   * owners.
   *
   * @param {string} source A Tezos address
   */
  source(source: string): void {
    this.validateAddress({ address: source });
    this._sourceAddress = source;
  }

  /**
   * Set an amount of mutez to transfer in this transaction this transaction. This is different than
   * the amount to transfer from a multisig wallet.
   *
   * @param {string} amount Amount in mutez (1/1000000 Tezies)
   */
  initialBalance(amount: string): void {
    if (this._type !== TransactionType.WalletInitialization) {
      throw new BuildTransactionError('Initial balance can only be set for wallet initialization transactions');
    }
    this.validateValue(new BigNumber(amount));
    this._initialBalance = amount;
  }

  /**
   * Set the transaction counter to prevent submitting repeated transactions.
   *
   * @param {string} counter The counter to use
   */
  counter(counter: string): void {
    this._counter = new BigNumber(counter);
  }

  /**
   * Set the destination address of a forwarder contract
   * Used in forwarder contract deployment as destination address
   *
   * @param {string} contractAddress - contract address to use
   */
  forwarderDestination(contractAddress: string): void {
    if (this._type !== TransactionType.AddressInitialization) {
      throw new BuildTransactionError('Forwarder destination can only be set for address initialization transactions');
    }
    if (!isValidOriginatedAddress(contractAddress)) {
      throw new BuildTransactionError('Forwarder destination can only be an originated address');
    }
    this._forwarderDestination = contractAddress;
  }

  // endregion

  // region PublicKeyRevelation builder methods
  /**
   * The public key to reveal.
   *
   * @param {string} publicKey A Tezos public key
   */
  publicKeyToReveal(publicKey: string): void {
    if (this._publicKeyToReveal) {
      throw new BuildTransactionError('Public key to reveal already set: ' + this._publicKeyToReveal);
    }

    const keyPair = new KeyPair({ pub: publicKey });
    if (keyPair.getAddress() !== this._sourceAddress) {
      throw new BuildTransactionError('Public key does not match the source address: ' + this._sourceAddress);
    }
    this._publicKeyToReveal = keyPair.getKeys().pub;
  }

  /**
   * Build a reveal operation for the source account with default fees.
   *
   * @returns {RevealOp} A Tezos reveal operation
   */
  private buildPublicKeyRevelationOperation(): RevealOp {
    const operation = revealOperation(this._counter.toString(), this._sourceAddress, this._publicKeyToReveal);
    this._counter = this._counter.plus(1);
    return operation;
  }
  // endregion

  // region WalletInitialization builder methods
  /**
   * Set one of the owners of the multisig wallet.
   *
   * @param {string} publicKey A Tezos public key
   */
  owner(publicKey: string): void {
    if (this._type !== TransactionType.WalletInitialization) {
      throw new BuildTransactionError('Multisig wallet owner can only be set for initialization transactions');
    }
    if (this._walletOwnerPublicKeys.length >= DEFAULT_M) {
      throw new BuildTransactionError('A maximum of ' + DEFAULT_M + ' owners can be set for a multisig wallet');
    }
    if (!isValidPublicKey(publicKey)) {
      throw new BuildTransactionError('Invalid public key: ' + publicKey);
    }
    if (this._walletOwnerPublicKeys.includes(publicKey)) {
      throw new BuildTransactionError('Repeated owner public key: ' + publicKey);
    }
    this._walletOwnerPublicKeys.push(publicKey);
  }

  /**
   * Set an initial delegate to initialize this wallet to. This is different than the delegation to
   * set while doing a separate delegation transaction.
   *
   * @param {string} delegate The address to delegate the funds to
   */
  initialDelegate(delegate: string): void {
    if (this._type !== TransactionType.WalletInitialization) {
      throw new BuildTransactionError('Initial delegation can only be set for wallet initialization transactions');
    }
    this.validateAddress({ address: delegate });
    this._initialDelegate = delegate;
  }

  /**
   * Build an origination operation for a generic multisig contract.
   *
   * @returns {Operation} A Tezos origination operation
   */
  private buildWalletInitializationOperations(): OriginationOp {
    const originationOp = genericMultisigOriginationOperation(
      this._counter.toString(),
      this._sourceAddress,
      this._fee.fee,
      this._fee.gasLimit || DEFAULT_GAS_LIMIT.ORIGINATION.toString(),
      this._fee.storageLimit || DEFAULT_STORAGE_LIMIT.ORIGINATION.toString(),
      this._initialBalance || '0',
      this._walletOwnerPublicKeys,
      this._initialDelegate
    );
    this._counter = this._counter.plus(1);
    return originationOp;
  }
  // endregion

  // region Send builder methods
  /**
   * Initialize a new TransferBuilder to for a singlesig or multisig transaction.
   *
   * @param {string} amount Amount in mutez to be transferred
   * @returns {TransferBuilder} A transfer builder
   */
  transfer(amount: string): TransferBuilder {
    if (this._type !== TransactionType.Send && this._type !== TransactionType.SingleSigSend) {
      throw new BuildTransactionError('Transfers can only be set for send transactions');
    }
    let transferBuilder = new TransferBuilder();
    // If source was set, use it as default for
    if (this._sourceAddress) {
      transferBuilder = transferBuilder.from(this._sourceAddress);
    }
    if (this._fee) {
      transferBuilder = transferBuilder.fee(this._fee.fee);
      transferBuilder = this._fee.gasLimit ? transferBuilder.gasLimit(this._fee.gasLimit) : transferBuilder;
      transferBuilder = this._fee.storageLimit ? transferBuilder.storageLimit(this._fee.storageLimit) : transferBuilder;
    }
    this._transfers.push(transferBuilder);
    return transferBuilder.amount(amount);
  }

  /**
   * Calculate the signatures for the multisig transaction.
   *
   * @param {string} packedData The string in hexadecimal to sign
   * @returns {Promise<string[]>} List of signatures for packedData
   */
  private async getSignatures(packedData: string): Promise<IndexedSignature[]> {
    const signatures: IndexedSignature[] = [];
    // Generate the multisig contract signatures
    for (let i = 0; i < this._multisigSignerKeyPairs.length; i++) {
      const signature = await sign(this._multisigSignerKeyPairs[i].key, packedData, new Uint8Array(0));
      const index = this._multisigSignerKeyPairs[i].index;
      signatures.push(index ? { signature: signature.sig, index } : { signature: signature.sig });
    }
    return signatures;
  }

  /**
   * Override the data to sign for a specific transfer. Used for offline signing to pass the
   * respective dataToSign for transfer at a particular index.
   *
   * @param {DataToSignOverride} data - data to override
   */
  overrideDataToSign(data: DataToSignOverride): void {
    if (!data.index) {
      data.index = this._dataToSignOverride.length;
    }
    this._dataToSignOverride.push(data);
  }

  /**
   * Build a transaction operation for a generic multisig contract.
   *
   * @returns {Promise<TransactionOp[]>} A Tezos transaction operation
   */
  private async buildSendTransactionContent(): Promise<TransactionOp[]> {
    const contents: TransactionOp[] = [];
    for (let i = 0; i < this._transfers.length; i++) {
      const transfer = this._transfers[i].build();
      let transactionOp;
      if (isValidOriginatedAddress(transfer.from)) {
        // Offline transactions may not have the data to sign
        const signatures = transfer.dataToSign ? await this.getSignatures(transfer.dataToSign) : [];
        transactionOp = multisigTransactionOperation(
          this._counter.toString(),
          this._sourceAddress,
          transfer.amount,
          transfer.from,
          transfer.counter || '0',
          transfer.to,
          signatures,
          transfer.fee.fee,
          transfer.fee.gasLimit,
          transfer.fee.storageLimit
        );
      } else {
        transactionOp = singlesigTransactionOperation(
          this._counter.toString(),
          this._sourceAddress,
          transfer.amount,
          transfer.to,
          transfer.fee.fee,
          transfer.fee.gasLimit,
          transfer.fee.storageLimit
        );
      }
      contents.push(transactionOp);
      this._counter = this._counter.plus(1);
    }
    return contents;
  }
  // endregion

  // region ForwarderAddressDeployment
  /**
   * Build a transaction operation for a forwarder contract
   *
   * @returns {OriginationOp} a Tezos transaction operation
   */
  private buildForwarderDeploymentContent(): OriginationOp {
    const operation = forwarderOriginationOperation(
      this._forwarderDestination,
      this._counter.toString(),
      this._sourceAddress,
      this._fee.fee,
      this._fee.gasLimit || DEFAULT_GAS_LIMIT.ORIGINATION.toString(),
      this._fee.storageLimit || DEFAULT_STORAGE_LIMIT.ORIGINATION.toString(),
      this._initialBalance || '0'
    );
    this._counter = this._counter.plus(1);
    return operation;
  }
  // endregion

  // region Validators
  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be below less than zero');
    }
    // TODO: validate the amount is not bigger than the max amount in Tezos
  }

  /** @inheritdoc */
  validateAddress(address: Address): void {
    if (!isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address ' + address.address);
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    const keyPair = new KeyPair({ prv: key.key });
    if (!keyPair.getKeys().prv) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    // TODO: validate the transaction is either a JSON or a hex
  }

  /** @inheritdoc */
  validateTransaction(transaction: Transaction): void {
    // TODO: validate all required fields are present in the builder before buildImplementation
    switch (this._type) {
      case TransactionType.AccountUpdate:
        break;
      case TransactionType.WalletInitialization:
        break;
      case TransactionType.Send:
        break;
      case TransactionType.AddressInitialization:
        break;
      case TransactionType.SingleSigSend:
        break;
      default:
        throw new BuildTransactionError('Transaction type not supported');
    }
  }
  // endregion

  /** @inheritdoc */
  displayName(): string {
    return this._coinConfig.fullName;
  }

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }
}
