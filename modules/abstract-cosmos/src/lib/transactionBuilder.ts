import {
  BaseKey,
  BaseTransactionBuilder,
  BuildTransactionError,
  PublicKey as BasePublicKey,
  SigningError,
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';

import {
  DelegateOrUndelegeteMessage,
  FeeData,
  MessageData,
  SendMessage,
  WithdrawDelegatorRewardsMessage,
} from './iface';
import { KeyPair } from './keyPair';
import { CosmosTransaction } from './transaction';
import utils from './utils';

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

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new CosmosTransaction(_coinConfig);
    this._sequence = 0;
    this._messages = [];
    this._gasBudget = { gasLimit: 0, amount: [] };
    this._signature = Buffer.alloc(0);
    this._signer = new KeyPair();
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
    utils.validateSequence(sequence);
    this._sequence = sequence;
    return this;
  }

  /**
   * Sets messages to the transaction body. Message type will be different based on the transaction type
   * - For @see TransactionType.StakingActivate required type is @see DelegateOrUndelegeteMessage
   * - For @see TransactionType.StakingDeactivate required type is @see DelegateOrUndelegeteMessage
   * - For @see TransactionType.Send required type is @see SendMessage
   * - For @see TransactionType.StakingWithdraw required type is @see WithdrawDelegatorRewardsMessage
   * @param {(SendMessage | DelegateOrUndelegeteMessage | WithdrawDelegatorRewardsMessage)[]} messages
   * @returns {TransactionBuilder} This transaction builder
   */
  abstract messages(messages: (SendMessage | DelegateOrUndelegeteMessage | WithdrawDelegatorRewardsMessage)[]): this;

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
}
