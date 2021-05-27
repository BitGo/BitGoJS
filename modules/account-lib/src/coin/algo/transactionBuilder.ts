import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import algosdk from 'algosdk';
import { BaseTransactionBuilder } from '../baseCoin';
import { BuildTransactionError, NotImplementedError, ParseTransactionError, SigningError } from '../baseCoin/errors';
import { BaseAddress, BaseFee, BaseKey } from '../baseCoin/iface';
import { isValidEd25519Seed } from '../../utils/crypto';
import { Transaction } from './transaction';
import { AddressValidationError, InsufficientFeeError } from './errors';
import { KeyPair } from './keyPair';

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
    if (this._keyPairs.length === 0) {
      throw new SigningError('No keypairs assigned for signing the transaction');
    } else if (this._keyPairs.length === 1) {
      this.transaction.sign(this._keyPairs[0]);
    } else {
      this.transaction.signMultiSig(this._keyPairs);
    }

    return this._transaction;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: Uint8Array | string): Transaction {
    const buffer = typeof rawTransaction === 'string' ? Buffer.from(rawTransaction, 'hex') : rawTransaction;
    let algosdkTxn: algosdk.Transaction;

    try {
      algosdkTxn = algosdk.decodeUnsignedTransaction(buffer);
    } catch (err: unknown) {
      throw new ParseTransactionError(`raw transaction cannot be decoded: ${err}`);
    }

    this._fee = algosdkTxn.fee;
    this._sender = algosdk.encodeAddress(algosdkTxn.from.publicKey);
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

  /**
   * Sets the number of signers required to sign the transaction.
   *
   * The number of signers cannot be set to a negative value.
   *
   * @param {number} n The number of signers.
   * @returns {TransactionBuilder} This transaction builder.
   */
  numberOfSigners(n: number): this {
    if (n < 0) {
      throw new BuildTransactionError(`Number of signers: '${n}' cannot be negative`);
    }

    this._transaction.numberOfSigners(n);

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
  validateRawTransaction(rawTransaction: unknown): void {
    throw new NotImplementedError('validateRawTransaction not implemented');
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    throw new NotImplementedError('validateTransaction not implemented');
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
