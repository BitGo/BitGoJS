import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilder } from '../baseCoin';
import { NotImplementedError } from '../baseCoin/errors';
import { BaseAddress, BaseKey } from '../baseCoin/iface';
import { Transaction } from './transaction';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  private _transaction: Transaction;

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
    this._isFlatFee = true;
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
    throw new NotImplementedError('validateAddress not implemented');
  }

  /** @inheritdoc */
  validateKey({ key }: BaseKey): void {
    throw new NotImplementedError('validateKey not implemented');
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    throw new NotImplementedError('validateRawTransaction not implemented');
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    throw new NotImplementedError('validateTransaction not implemented');
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    throw new NotImplementedError('validateValue not implemented');
  }

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }
}
