import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  BaseAddress,
  BaseKey,
  BaseTransactionBuilder,
  BuildTransactionError,
  FeeOptions,
  PublicKey as BasePublicKey,
  Signature,
  SigningError,
  TransactionType,
} from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { Blockhash, PublicKey, Transaction as SolTransaction } from '@solana/web3.js';
import {
  isValidAddress,
  isValidAmount,
  isValidBlockId,
  isValidMemo,
  validateAddress,
  validateRawTransaction,
} from './utils';
import { KeyPair } from '.';
import { InstructionBuilderTypes } from './constants';
import { solInstructionFactory } from './solInstructionFactory';
import assert from 'assert';
import { DurableNonceParams, InstructionParams, Memo, Nonce, Transfer } from './iface';
import { instructionParamsFactory } from './instructionParamsFactory';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  private _signatures: Signature[] = [];
  private _lamportsPerSignature: number;
  private _tokenAccountRentExemptAmount: string;

  protected _sender: string;
  protected _recentBlockhash: Blockhash;
  protected _nonceInfo: Nonce;
  protected _instructionsData: InstructionParams[] = [];
  protected _signers: KeyPair[] = [];
  protected _memo?: string;
  protected _feePayer?: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction = new Transaction(_coinConfig);
  }

  /**
   * The transaction type.
   */
  protected abstract get transactionType(): TransactionType;

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    this._transaction = tx;
    const txData = tx.toJson();

    const filteredTransferInstructionsData = txData.instructionsData.filter(
      (data) => data.type === InstructionBuilderTypes.Transfer
    );
    let sender;
    if (filteredTransferInstructionsData.length > 0) {
      const transferInstructionsData = filteredTransferInstructionsData[0] as Transfer;
      sender = transferInstructionsData.params.fromAddress;
    } else {
      sender = txData.feePayer;
    }
    this.sender(sender);
    this.feePayer(txData.feePayer as string);
    this.nonce(txData.nonce, txData.durableNonce);
    this._instructionsData = instructionParamsFactory(tx.type, tx.solTransaction.instructions);

    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.Memo) {
        const memoInstruction: Memo = instruction;
        this.memo(memoInstruction.params.memo);
      }

      if (instruction.type === InstructionBuilderTypes.NonceAdvance) {
        const advanceNonceInstruction: Nonce = instruction;
        this.nonce(txData.nonce, advanceNonceInstruction.params);
      }
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = new Transaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.solTransaction = this.buildSolTransaction();
    this.transaction.setTransactionType(this.transactionType);
    this.transaction.loadInputsAndOutputs();
    this._transaction.tokenAccountRentExemptAmount = this._tokenAccountRentExemptAmount;
    return this.transaction;
  }

  /**
   * Builds the solana transaction.
   */
  protected buildSolTransaction(): SolTransaction {
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(this._recentBlockhash, new BuildTransactionError('recent blockhash is required before building'));

    const tx = new SolTransaction();
    if (this._transaction?.solTransaction?.signatures) {
      tx.signatures = this._transaction?.solTransaction?.signatures;
    }

    tx.feePayer = this._feePayer ? new PublicKey(this._feePayer) : new PublicKey(this._sender);

    if (this._nonceInfo) {
      tx.nonceInfo = {
        nonce: this._recentBlockhash,
        nonceInstruction: solInstructionFactory(this._nonceInfo)[0],
      };
    } else {
      tx.recentBlockhash = this._recentBlockhash;
    }
    for (const instruction of this._instructionsData) {
      tx.add(...solInstructionFactory(instruction));
    }

    if (this._memo) {
      const memoData: Memo = {
        type: InstructionBuilderTypes.Memo,
        params: {
          memo: this._memo,
        },
      };
      this._instructionsData.push(memoData);
      tx.add(...solInstructionFactory(memoData));
    }

    this._transaction.lamportsPerSignature = this._lamportsPerSignature;

    for (const signer of this._signers) {
      const publicKey = new PublicKey(signer.getKeys().pub);
      const secretKey = signer.getKeys(true).prv;
      assert(secretKey instanceof Uint8Array);
      tx.partialSign({ publicKey, secretKey });
    }

    for (const signature of this._signatures) {
      const solPublicKey = new PublicKey(signature.publicKey.pub);
      tx.addSignature(solPublicKey, signature.signature);
    }

    return tx;
  }

  // region Getters and Setters
  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    this.validateKey(key);
    this.checkDuplicatedSigner(key);
    const prv = key.key;
    const signer = new KeyPair({ prv: prv });
    this._signers.push(signer);

    return this._transaction;
  }

  /** @inheritDoc */
  addSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this._signatures.push({ publicKey, signature });
  }

  /**
   * Sets the sender of this transaction.
   * This account will be responsible for paying transaction fees.
   *
   * @param {string} senderAddress the account that is sending this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  sender(senderAddress: string): this {
    validateAddress(senderAddress, 'sender');
    this._sender = senderAddress;
    return this;
  }

  /**
   * Set the transaction nonce
   * Requires both optional params in order to use the durable nonce
   *
   * @param {Blockhash} blockHash The latest blockHash
   * @param {DurableNonceParams} [durableNonceParams] An object containing the walletNonceAddress and the authWalletAddress (required for durable nonce)
   * @returns {TransactionBuilder} This transaction builder
   */
  nonce(blockHash: Blockhash, durableNonceParams?: DurableNonceParams): this {
    if (!blockHash || !isValidBlockId(blockHash)) {
      throw new BuildTransactionError('Invalid or missing blockHash, got: ' + blockHash);
    }
    if (durableNonceParams) {
      validateAddress(durableNonceParams.walletNonceAddress, 'walletNonceAddress');
      validateAddress(durableNonceParams.authWalletAddress, 'authWalletAddress');
      if (durableNonceParams.walletNonceAddress === durableNonceParams.authWalletAddress) {
        throw new BuildTransactionError('Invalid params: walletNonceAddress cannot be equal to authWalletAddress');
      }
      this._nonceInfo = {
        type: InstructionBuilderTypes.NonceAdvance,
        params: durableNonceParams,
      };
    }
    this._recentBlockhash = blockHash;
    return this;
  }

  /**
   *  Set the memo
   *
   * @param {string} memo
   * @returns {TransactionBuilder} This transaction builder
   */
  memo(memo: string): this {
    this.validateMemo(memo);
    this._memo = memo;
    return this;
  }

  fee(feeOptions: FeeOptions): this {
    this._lamportsPerSignature = Number(feeOptions.amount);
    return this;
  }

  feePayer(feePayer: string): this {
    this._feePayer = feePayer;
    return this;
  }

  /**
   * Used to set the minimum rent exempt amount for an ATA
   *
   * @param tokenAccountRentExemptAmount minimum rent exempt amount in lamports
   */
  associatedTokenAccountRent(tokenAccountRentExemptAmount: string): this {
    this.validateRentExemptAmount(tokenAccountRentExemptAmount);
    this._tokenAccountRentExemptAmount = tokenAccountRentExemptAmount;
    return this;
  }

  private validateRentExemptAmount(tokenAccountRentExemptAmount: string) {
    // _tokenAccountRentExemptAmount is allowed to be undefined or a valid amount if it's defined
    if (tokenAccountRentExemptAmount && !isValidAmount(tokenAccountRentExemptAmount)) {
      throw new BuildTransactionError('Invalid tokenAccountRentExemptAmount, got: ' + tokenAccountRentExemptAmount);
    }
  }

  // endregion

  // region Validators
  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address ' + address.address);
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    let keyPair: KeyPair;
    try {
      keyPair = new KeyPair({ prv: key.key });
    } catch {
      throw new BuildTransactionError('Invalid key');
    }

    if (!keyPair.getKeys().prv) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    validateRawTransaction(rawTransaction);
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    this.validateSender();
    this.validateNonce();
    this.validateRentExemptAmount(this._tokenAccountRentExemptAmount);
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }
  /** Validates the memo
   *
   * @param {string} memo - the memo as string
   */
  validateMemo(memo: string): void {
    if (!memo) {
      throw new BuildTransactionError('Invalid memo, got: ' + memo);
    }
    if (!isValidMemo(memo)) {
      throw new BuildTransactionError('Memo is too long');
    }
  }

  /**
   * Validates that the given key is not already in this._signers
   *
   * @param {BaseKey} key - The key to check
   */
  private checkDuplicatedSigner(key: BaseKey) {
    this._signers.forEach((kp) => {
      if (kp.getKeys().prv === key.key) {
        throw new SigningError('Duplicated signer: ' + key.key);
      }
    });
  }

  /**
   * Validates that the sender field is defined
   */
  private validateSender(): void {
    if (this._sender === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing sender');
    }
  }

  /**
   * Validates that the nonce field is defined
   */
  private validateNonce(): void {
    if (this._recentBlockhash === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing nonce blockhash');
    }
  }
  // endregion
}
