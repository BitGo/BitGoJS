import {
  BaseAddress,
  BaseKey,
  BaseTransactionBuilder,
  BuildTransactionError,
  InvalidTransactionError,
  PublicKey as BasePublicKey,
  SigningError,
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Secp256k1 } from '@cosmjs/crypto';
import { makeSignBytes } from '@cosmjs/proto-signing';
import BigNumber from 'bignumber.js';
import { CosmosTransactionMessage, FeeData, MessageData } from './iface';
import { CosmosKeyPair as KeyPair } from './keyPair';
import { CosmosTransaction } from './transaction';
import { CosmosUtils } from './utils';

export abstract class CosmosTransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: CosmosTransaction;
  protected _sequence: number;
  protected _messages: MessageData[];
  protected _gasBudget: FeeData;
  protected _accountNumber?: number;
  protected _signature: Buffer;
  protected _chainId?: string;
  protected _publicKey?: string;
  protected _signer: KeyPair;
  protected _memo?: string;

  protected _utils: CosmosUtils;

  constructor(_coinConfig: Readonly<CoinConfig>, _utils: CosmosUtils) {
    super(_coinConfig);
    this._transaction = new CosmosTransaction(_coinConfig, _utils);
  }

  /**
   * The transaction type.
   */
  protected abstract get transactionType(): TransactionType;

  /** @inheritdoc */
  protected get transaction(): CosmosTransaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: CosmosTransaction) {
    this._transaction = transaction;
  }

  /** @inheritDoc */
  addSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this._signature = signature;
    this._publicKey = publicKey.pub;
  }

  /**
   * Sets sequence of this transaction.
   * @param {number} sequence - sequence data for tx signer
   * @returns {TransactionBuilder} This transaction builder
   */
  sequence(sequence: number): this {
    this._utils.validateSequence(sequence);
    this._sequence = sequence;
    return this;
  }

  /**
   * Sets messages to the transaction body. Message type will be different based on the transaction type
   * - For @see TransactionType.StakingActivate required type is @see DelegateOrUndelegeteMessage
   * - For @see TransactionType.StakingDeactivate required type is @see DelegateOrUndelegeteMessage
   * - For @see TransactionType.Send required type is @see SendMessage
   * - For @see TransactionType.StakingWithdraw required type is @see WithdrawDelegatorRewardsMessage
   * - For @see TransactionType.ContractCall required type is @see ExecuteContractMessage
   * @param {CosmosTransactionMessage[]} messages
   * @returns {TransactionBuilder} This transaction builder
   */
  abstract messages(messages: CosmosTransactionMessage[]): this;

  publicKey(publicKey: string | undefined): this {
    this._publicKey = publicKey;
    return this;
  }

  accountNumber(accountNumber: number | undefined): this {
    this._accountNumber = accountNumber;
    return this;
  }

  chainId(chainId: string | undefined): this {
    this._chainId = chainId;
    return this;
  }

  memo(memo: string | undefined): this {
    this._memo = memo;
    return this;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): CosmosTransaction {
    this.validateKey(key);
    if (this._accountNumber === undefined) {
      throw new SigningError('accountNumber is required before signing');
    }
    if (this._chainId === undefined) {
      throw new SigningError('chainId is required before signing');
    }
    this._signer = new KeyPair({ prv: key.key });
    this._publicKey = this._signer.getKeys().pub;
    return this.transaction;
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    try {
      new KeyPair({ prv: key.key });
    } catch {
      throw new BuildTransactionError(`Key validation failed`);
    }
  }

  /**
   * Sets gas budget of this transaction
   * Gas budget consist of fee amount and gas limit. Division feeAmount/gasLimit represents
   * the gas-fee and it should be more than minimum required gas-fee to process the transaction
   * @param {FeeData} gasBudget
   * @returns {TransactionBuilder} this transaction builder
   */
  gasBudget(gasBudget: FeeData): this {
    this._utils.validateGasBudget(gasBudget);
    this._gasBudget = gasBudget;
    return this;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   * @param {CosmosTransaction} tx the transaction data
   */
  initBuilder(tx: CosmosTransaction): void {
    this._transaction = tx;
    const txData = tx.toJson();
    this.gasBudget(txData.gasBudget);
    this.messages(
      txData.sendMessages.map((message) => {
        return message.value;
      })
    );
    this.sequence(txData.sequence);
    this.publicKey(txData.publicKey);
    this.accountNumber(txData.accountNumber);
    this.chainId(txData.chainId);
    this.memo(txData.memo);
    if (tx.signature && tx.signature.length > 0) {
      this.addSignature({ pub: txData.publicKey } as any, Buffer.from(tx.signature[0], 'hex'));
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): CosmosTransaction {
    const tx = new CosmosTransaction(this._coinConfig, this._utils);
    tx.enrichTransactionDetailsFromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<CosmosTransaction> {
    this.transaction.transactionType = this.transactionType;
    if (this._accountNumber) {
      this.transaction.accountNumber = this._accountNumber;
    }
    if (this._chainId) {
      this.transaction.chainId = this._chainId;
    }
    this.transaction.cosmosLikeTransaction = this._utils.createTransaction(
      this._sequence,
      this._messages,
      this._gasBudget,
      this._publicKey,
      this._memo
    );

    const privateKey = this._signer?.getPrivateKey();
    if (privateKey !== undefined && this.transaction.cosmosLikeTransaction.publicKey !== undefined) {
      const signDoc = this._utils.createSignDoc(
        this.transaction.cosmosLikeTransaction,
        this._accountNumber,
        this._chainId
      );
      const txnHash = Uint8Array.from(this._utils.getHashFunction().update(makeSignBytes(signDoc)).digest());
      const signature = await Secp256k1.createSignature(txnHash, privateKey);
      const compressedSig = Buffer.concat([signature.r(), signature.s()]);
      this.addSignature({ pub: this.transaction.cosmosLikeTransaction.publicKey }, compressedSig);
    }

    if (this._signature !== undefined) {
      this.transaction.addSignature(this._signature.toString('hex'));
      this.transaction.cosmosLikeTransaction = this._utils.createTransactionWithHash(
        this._sequence,
        this._messages,
        this._gasBudget,
        this._publicKey,
        this._signature,
        this._memo
      );
    }
    this.transaction.loadInputsAndOutputs();
    return this.transaction;
  }

  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!(this._utils.isValidAddress(address.address) || this._utils.isValidValidatorAddress(address.address))) {
      throw new BuildTransactionError('transactionBuilder: address isValidAddress check failed: ' + address.address);
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction) {
      throw new InvalidTransactionError('Invalid raw transaction: Undefined rawTransaction');
    }
    try {
    } catch (e) {
      throw new InvalidTransactionError('Invalid raw transaction: ' + e.message);
    }
    const cosmosTransaction = this._utils.deserializeTransaction(rawTransaction);
    this._utils.validateTransaction(cosmosTransaction);
  }

  /** @inheritdoc */
  validateTransaction(transaction: CosmosTransaction): void {
    this._utils.validateTransaction({
      sequence: this._sequence,
      sendMessages: this._messages,
      gasBudget: this._gasBudget,
      publicKey: this._publicKey,
    });
  }
}
