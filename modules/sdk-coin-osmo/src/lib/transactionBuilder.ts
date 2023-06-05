import { BaseAddress, BuildTransactionError, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Secp256k1, sha256 } from '@cosmjs/crypto';
import { makeSignBytes } from '@cosmjs/proto-signing';

import {
  CosmosTransaction,
  DelegateOrUndelegeteMessage,
  FeeData,
  SendMessage,
  WithdrawDelegatorRewardsMessage,
  CosmosTransactionBuilder,
} from '@bitgo/abstract-cosmos';

import { OsmoTransaction } from './transaction';
import utils from './utils';

export abstract class OsmoTransactionBuilder extends CosmosTransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new OsmoTransaction(_coinConfig);
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

  /**
   * The transaction type.
   */
  protected abstract get transactionType(): TransactionType;

  /**
   * Sets gas budget of this transaction
   * Gas budget consist of fee amount and gas limit. Division feeAmount/gasLimit represents
   * the gas-fee and it should be more than minimum required gas-fee to process the transaction
   * @param {FeeData} gasBudget
   * @returns {TransactionBuilder} this transaction builder
   */
  gasBudget(gasBudget: FeeData): this {
    utils.validateGasBudget(gasBudget);
    this._gasBudget = gasBudget;
    return this;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   * @param {OsmoTransaction} tx the transaction data
   */
  initBuilder(tx: OsmoTransaction): void {
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
    const tx = new OsmoTransaction(this._coinConfig);
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
    this.transaction.cosmosLikeTransaction = utils.createOsmoTransaction(
      this._sequence,
      this._messages,
      this._gasBudget,
      this._publicKey,
      this._memo
    );

    const privateKey = this._signer?.getPrivateKey();
    if (privateKey !== undefined && this.transaction.cosmosLikeTransaction.publicKey !== undefined) {
      const signDoc = utils.createSignDoc(this.transaction.cosmosLikeTransaction, this._accountNumber, this._chainId);
      const txnHash = sha256(makeSignBytes(signDoc));
      const signature = await Secp256k1.createSignature(txnHash, privateKey);
      const compressedSig = Buffer.concat([signature.r(), signature.s()]);
      this.addSignature({ pub: this.transaction.cosmosLikeTransaction.publicKey }, compressedSig);
    }

    if (this._signature !== undefined) {
      this.transaction.addSignature(this._signature.toString('hex'));
      this.transaction.cosmosLikeTransaction = utils.createOsmoTransactionWithHash(
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

  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!(utils.isValidAddress(address.address) || utils.isValidValidatorAddress(address.address))) {
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
    const osmoTransaction = utils.deserializeOsmoTransaction(rawTransaction);
    utils.validateOsmoTransaction(osmoTransaction);
  }

  /** @inheritdoc */
  validateTransaction(transaction: OsmoTransaction): void {
    utils.validateOsmoTransaction({
      sequence: this._sequence,
      sendMessages: this._messages,
      gasBudget: this._gasBudget,
      publicKey: this._publicKey,
    });
  }
}
