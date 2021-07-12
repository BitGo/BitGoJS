import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import algosdk from 'algosdk';
import { BaseTransactionBuilder, TransactionType } from '../baseCoin';
import { BuildTransactionError, InvalidTransactionError } from '../baseCoin/errors';
import { BaseAddress, BaseFee, BaseKey } from '../baseCoin/iface';
import { isValidEd25519Seed } from '../../utils/crypto';
import { Transaction } from './transaction';
import { AddressValidationError, InsufficientFeeError } from './errors';
import { KeyPair } from './keyPair';
import { BaseTransactionSchema } from './txnSchema';
import Utils from './utils';

const MIN_FEE = 1000; // in microalgos

const MAINNET_GENESIS_ID = 'mainnet-v1.0';
const MAINNET_GENESIS_HASH = 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=';
const TESTNET_GENESIS_ID = 'testnet-v1.0';
const TESTNET_GENESIS_HASH = 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=';
const BETANET_GENESIS_ID = 'betanet-v1.0';
const BETANET_GENESIS_HASH = 'mFgazF+2uRS1tMiL9dsj01hJGySEmPN28B/TjjvpVW0=';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  protected _keyPairs: KeyPair[];

  // the fee is specified as a number here instead of a big number because
  // the algosdk also specifies it as a number.
  protected _fee: number;
  protected _isFlatFee: boolean;

  protected _sender: string;
  protected _genesisHash: string;
  protected _genesisId: string;
  protected _firstRound: number;
  protected _lastRound: number;
  protected _lease?: Uint8Array;
  protected _note?: Uint8Array;
  protected _reKeyTo?: string;
  protected _suggestedParams: algosdk.SuggestedParams;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);

    this._transaction = new Transaction(coinConfig);
    this._keyPairs = [];
  }

  /**
   * Sets the fee.
   *
   * The minimum fee is 1000 microalgos.
   *
   * @param {BaseFee} feeObj The amount to pay to the fee sink denoted in microalgos
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://developer.algorand.org/docs/reference/transactions/
   */
  fee(feeObj: BaseFee): this {
    const fee = new BigNumber(feeObj.fee).toNumber();
    if (this._isFlatFee && fee < MIN_FEE) {
      throw new InsufficientFeeError(fee, MIN_FEE);
    }

    this._fee = fee;

    return this;
  }

  /**
   * Sets whether the fee is a flat fee.
   *
   * A flat fee is the fee for the entire transaction whereas a normal fee
   * is a fee for every byte in the transaction.
   *
   * @param {boolean} isFlatFee Whether the fee should be specified as a flat fee.
   * @returns {TransactionBuilder} This transaction builder.
   */
  isFlatFee(isFlatFee: boolean): this {
    this._isFlatFee = isFlatFee;

    return this;
  }

  /**
   * Sets the transaction sender.
   *
   * @param {BaseAddress} sender The sender account
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://developer.algorand.org/docs/reference/transactions/
   */
  sender(sender: BaseAddress): this {
    this.validateAddress(sender);
    this._sender = sender.address;
    this._transaction.sender(sender.address);

    return this;
  }

  /**
   * Sets the genesis id.
   *
   * @param {string} genesisId The genesis id.
   * @example "mainnet-v1.0"
   *
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://developer.algorand.org/docs/reference/transactions/
   */
  genesisId(genesisId: string): this {
    this._genesisId = genesisId;

    return this;
  }

  /**
   * Sets the genesis hash.
   *
   * The genesis hash must be base64 encoded.
   *
   * @param {string} genesisHash The genesis hash.
   * @example "wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8="
   *
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://developer.algorand.org/docs/reference/transactions/
   */
  genesisHash(genesisHash: string): this {
    this._genesisHash = genesisHash;

    return this;
  }

  /**
   * Sets the genesis id and hash to mainnet.
   *
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://developer.algorand.org/docs/reference/algorand-networks/mainnet/#genesis-id
   * @see https://developer.algorand.org/docs/reference/algorand-networks/mainnet/#genesis-hash
   */
  mainnet(): this {
    this.genesisId(MAINNET_GENESIS_ID);
    this.genesisHash(MAINNET_GENESIS_HASH);

    return this;
  }

  /**
   * Sets the genesis id and hash to testnet.
   *
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://developer.algorand.org/docs/reference/algorand-networks/testnet/#genesis-id
   * @see https://developer.algorand.org/docs/reference/algorand-networks/testnet/#genesis-hash
   */
  testnet(): this {
    this.genesisId(TESTNET_GENESIS_ID);
    this.genesisHash(TESTNET_GENESIS_HASH);

    return this;
  }

  /**
   * Sets the genesis id and hash to betanet.
   *
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://developer.algorand.org/docs/reference/algorand-networks/betanet/#genesis-id
   * @see https://developer.algorand.org/docs/reference/algorand-networks/betanet/#genesis-hash
   */
  betanet(): this {
    this.genesisId(BETANET_GENESIS_ID);
    this.genesisHash(BETANET_GENESIS_HASH);

    return this;
  }

  /**
   * Sets the first round.
   *
   * @param {number} round The first protocol round on which this txn is valid.
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://developer.algorand.org/docs/reference/transactions/
   */
  firstRound(round: number): this {
    this.validateValue(new BigNumber(round));

    this._firstRound = round;

    return this;
  }

  /**
   * Sets the last round.
   *
   * @param {number} round The first protocol round on which this txn is valid.
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://developer.algorand.org/docs/reference/transactions/
   */
  lastRound(round: number): this {
    this.validateValue(new BigNumber(round));

    this._lastRound = round;

    return this;
  }

  /**
   * Sets the lease on the transaction.
   *
   * A lease is a mutex on the transaction that prevents any other transaction
   * from being sent with the same lease until the prior transaction's last
   * round has passed.
   *
   * @param {Uint8Array} lease The lease to put the transaction.
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://developer.algorand.org/docs/reference/transactions/
   */
  lease(lease: Uint8Array): this {
    this._lease = lease;

    return this;
  }

  /**
   * Sets the note for the transaction.
   *
   * @param {Uint8Array} note Arbitrary data for sender to store.
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://developer.algorand.org/docs/reference/transactions/
   */
  note(note: Uint8Array): this {
    this._note = note;

    return this;
  }

  /**
   * Sets the authorized address.
   *
   * The authorized asset will be used to authorize all future transactions.
   *
   * @param {BaseAddress} authorizer The address to delegate authorization authority to.
   * @returns {TransactionBuilder} This transaction builder.
   *
   * @see https://developer.algorand.org/docs/reference/transactions/
   */
  reKeyTo(authorizer: BaseAddress): this {
    this.validateAddress(authorizer);
    this._reKeyTo = authorizer.address;

    return this;
  }

  /** @inheritdoc */
  validateAddress({ address }: BaseAddress): void {
    if (!algosdk.isValidAddress(address)) {
      throw new AddressValidationError(address);
    }
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.setAlgoTransaction(this.buildAlgoTxn());
    this.transaction.setTransactionType(this.transactionType);

    this.transaction.sign(this._keyPairs);
    this._transaction.loadInputsAndOutputs();
    return this._transaction;
  }

  /**
   * Builds the algorand transaction.
   */
  protected abstract buildAlgoTxn(): algosdk.Transaction;

  /**
   * The transaction type.
   */
  protected abstract get transactionType(): TransactionType;

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: Uint8Array | string): Transaction {
    const decodedTxn = Utils.decodeAlgoTxn(rawTransaction);
    const algosdkTxn = decodedTxn.txn;

    if (decodedTxn.signed) {
      this._transaction.signedTransaction =
        typeof rawTransaction === 'string' ? Utils.hexStringToUInt8Array(rawTransaction) : rawTransaction;
    }
    this.sender({ address: algosdk.encodeAddress(algosdkTxn.from.publicKey) });
    this._isFlatFee = true;
    this._fee = algosdkTxn.fee;
    this._genesisHash = algosdkTxn.genesisHash.toString('base64');
    this._genesisId = algosdkTxn.genesisID;
    this._firstRound = algosdkTxn.firstRound;
    this._lastRound = algosdkTxn.lastRound;
    this._lease = algosdkTxn.lease;
    this._note = algosdkTxn.note;
    this._reKeyTo = algosdkTxn.reKeyTo ? algosdk.encodeAddress(algosdkTxn.reKeyTo.publicKey) : undefined;

    this._transaction.setAlgoTransaction(algosdkTxn);

    return this._transaction;
  }

  /** @inheritdoc */
  protected signImplementation({ key }: BaseKey): Transaction {
    const keypair = new KeyPair({ prv: key });
    this._keyPairs.push(keypair);

    return this._transaction;
  }

  numberOfSigners(num: number): this {
    this._transaction.setNumberOfRequiredSigners(num);

    return this;
  }

  setSigners(addrs: string | string[]): this {
    const signers = addrs instanceof Array ? addrs : [addrs];
    signers.forEach((address) => this.validateAddress({ address: address }));
    this._transaction.signers = signers;
    return this;
  }

  /**
   * Sets the number of signers required to sign the transaction.
   *
   * The number of signers cannot be set to a negative value.
   *
   * @param {number} n The number of signers.
   * @returns {TransactionBuilder} This transaction builder.
   */
  numberOfRequiredSigners(n: number): this {
    if (n < 0) {
      throw new BuildTransactionError(`Number of signers: '${n}' cannot be negative`);
    }

    this._transaction.setNumberOfRequiredSigners(n);

    return this;
  }

  /**
   * @inheritdoc
   * @see https://developer.algorand.org/docs/features/accounts/#transformation-private-key-to-base64-private-key
   */
  validateKey({ key }: BaseKey): void {
    const isValidPrivateKeyFromBytes = Buffer.isBuffer(key) && isValidEd25519Seed(key.toString('hex'));
    const isValidPrivateKeyFromHex = isValidEd25519Seed(key);
    const isValidPrivateKeyFromBase64 = isValidEd25519Seed(Buffer.from(key, 'base64').toString('hex'));

    if (!isValidPrivateKeyFromBytes && !isValidPrivateKeyFromHex && !isValidPrivateKeyFromBase64) {
      throw new BuildTransactionError(`Key validation failed`);
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: Uint8Array | string): void {
    const decodedTxn = Utils.decodeAlgoTxn(rawTransaction);
    const algoTxn = decodedTxn.txn;

    const validationResult = BaseTransactionSchema.validate({
      fee: algoTxn?.fee,
      firstRound: algoTxn?.firstRound,
      genesisHash: algoTxn?.genesisHash.toString('base64'),
      lastRound: algoTxn?.lastRound,
      sender: algoTxn ? algosdk.encodeAddress(algoTxn.from.publicKey) : undefined,
      genesisId: algoTxn?.genesisID,
      lease: algoTxn?.lease,
      note: algoTxn?.note,
      reKeyTo: algoTxn?.reKeyTo ? algosdk.encodeAddress(algoTxn.reKeyTo.publicKey) : undefined,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }

  /** @inheritdoc */
  validateTransaction(_: Transaction): void {
    this.validateBaseFields(
      this._fee,
      this._firstRound,
      this._genesisHash,
      this._lastRound,
      this._sender,
      this._genesisId,
      this._lease,
      this._note,
      this._reKeyTo,
    );
  }

  private validateBaseFields(
    fee: number,
    firstRound: number,
    genesisHash: string,
    lastRound: number,
    sender: string,
    genesisId: string,
    lease: Uint8Array | undefined,
    note: Uint8Array | undefined,
    reKeyTo: string | undefined,
  ): void {
    const validationResult = BaseTransactionSchema.validate({
      fee,
      firstRound,
      genesisHash,
      lastRound,
      sender,
      genesisId,
      lease,
      note,
      reKeyTo,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  /**
   * Convenience method to retrieve the algosdk suggested parameters.
   *
   * @returns {algosdk.SuggestedParams} The algosdk suggested parameters.
   */
  protected get suggestedParams(): algosdk.SuggestedParams {
    return {
      flatFee: this._isFlatFee,
      fee: this._fee,
      firstRound: this._firstRound,
      lastRound: this._lastRound,
      genesisID: this._genesisId,
      genesisHash: this._genesisHash,
    };
  }
}
