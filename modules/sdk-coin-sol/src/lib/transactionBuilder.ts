import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  BaseAddress,
  BaseKey,
  BaseTransaction,
  BaseTransactionBuilder,
  BuildTransactionError,
  FeeOptions,
  PublicKey as BasePublicKey,
  Signature,
  SigningError,
  SolVersionedTransactionData,
  TransactionType,
} from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import {
  Blockhash,
  MessageAddressTableLookup,
  MessageV0,
  PublicKey,
  Transaction as SolTransaction,
  VersionedTransaction,
} from '@solana/web3.js';
import base58 from 'bs58';
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
import { DurableNonceParams, InstructionParams, Memo, Nonce, SetPriorityFee, Transfer } from './iface';
import { instructionParamsFactory } from './instructionParamsFactory';
import { WasmTransaction, buildWasmTransaction, buildVersionedWasmTransaction } from './wasm';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  protected _parsedWasmTransaction?: WasmTransaction; // WASM-parsed transaction (testnet only)
  protected _versionedTransactionData?: SolVersionedTransactionData; // Versioned data for WASM path (no web3)
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
  protected _priorityFee: number;

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
    this._instructionsData = instructionParamsFactory(
      tx.type,
      tx.solTransaction.instructions,
      this._coinConfig.name,
      txData.instructionsData,
      tx.useTokenAddressTokenName
    );
    // Parse priority fee instruction data
    const filteredPriorityFeeInstructionsData = txData.instructionsData.filter(
      (data) => data.type === InstructionBuilderTypes.SetPriorityFee
    );

    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.Memo) {
        const memoInstruction: Memo = instruction;
        this.memo(memoInstruction.params.memo);
      }

      if (instruction.type === InstructionBuilderTypes.NonceAdvance) {
        const advanceNonceInstruction: Nonce = instruction;
        this.nonce(txData.nonce, advanceNonceInstruction.params);
      }

      // If prio fee instruction exists, set the priority fee variable
      if (instruction.type === InstructionBuilderTypes.SetPriorityFee) {
        const priorityFeeInstructionsData = filteredPriorityFeeInstructionsData[0] as SetPriorityFee;
        this.setPriorityFee({ amount: Number(priorityFeeInstructionsData.params.fee) });
      }
    }
  }

  /**
   * Initialize the transaction builder fields from a WASM-parsed transaction.
   * Used for testnet where both parsing and building use WASM.
   *
   * @param {WasmTransaction} wasmTx the WASM-parsed transaction
   */
  initBuilderFromWasm(wasmTx: WasmTransaction): void {
    this._parsedWasmTransaction = wasmTx;
    const txData = wasmTx.toJson();

    // Extract sender from transfer instruction or use fee payer
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

    // Use instructionsData directly from WASM parsing (no need for instructionParamsFactory)
    this._instructionsData = txData.instructionsData;

    // Parse priority fee instruction data
    const filteredPriorityFeeInstructionsData = txData.instructionsData.filter(
      (data) => data.type === InstructionBuilderTypes.SetPriorityFee
    );

    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.Memo) {
        const memoInstruction: Memo = instruction;
        this.memo(memoInstruction.params.memo);
      }

      if (instruction.type === InstructionBuilderTypes.NonceAdvance) {
        const advanceNonceInstruction: Nonce = instruction;
        this.nonce(txData.nonce, advanceNonceInstruction.params);
      }

      // If prio fee instruction exists, set the priority fee variable
      if (instruction.type === InstructionBuilderTypes.SetPriorityFee) {
        const priorityFeeInstructionsData = filteredPriorityFeeInstructionsData[0] as SetPriorityFee;
        this.setPriorityFee({ amount: Number(priorityFeeInstructionsData.params.fee) });
      }
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    this.validateRawTransaction(rawTransaction);

    // Use WASM parsing for testnet
    const isTestnet = this._coinConfig.name === 'tsol';
    if (isTestnet) {
      const wasmTx = new WasmTransaction(this._coinConfig);
      wasmTx.fromRawTransaction(rawTransaction);
      this.initBuilderFromWasm(wasmTx);
      return this.transaction;
    }

    // Legacy parsing for mainnet
    const tx = new Transaction(this._coinConfig);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<BaseTransaction> {
    const isTestnet = this._coinConfig.name === 'tsol';

    // For testnet, use WASM building in all scenarios:
    // 1. Round-trip: We have a parsed WASM transaction - just add signatures without rebuilding.
    //    This handles all instruction types including VersionedCustomInstruction.
    // 2. New transaction: Build from scratch using instruction params.
    // 3. fromVersionedTransactionData(): Build from raw MessageV0 data using
    //    WasmTransaction.fromVersionedData() - no legacy @solana/web3.js needed!
    if (isTestnet) {
      // Check if we have versioned data stored on builder (from fromVersionedTransactionData)
      const hasVersionedDataWithoutParsedTx = this._versionedTransactionData && !this._parsedWasmTransaction;

      if (hasVersionedDataWithoutParsedTx) {
        // Build from raw versioned data using WASM
        return this.buildVersionedWithWasm();
      }

      // Normal WASM building (round-trip or new transaction)
      return this.buildWithWasm();
    }

    // Legacy building for mainnet
    return this.buildLegacy();
  }

  /**
   * Build transaction using WASM (testnet only).
   *
   * Delegates to the clean WASM builder module.
   * All WASM-specific logic lives in wasm/builder.ts
   */
  private async buildWithWasm(): Promise<WasmTransaction> {
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(this._recentBlockhash, new BuildTransactionError('recent blockhash is required before building'));

    // Add memo to instructions if set
    if (this._memo && !this._instructionsData.some((i) => i.type === InstructionBuilderTypes.Memo)) {
      const memoData: Memo = {
        type: InstructionBuilderTypes.Memo,
        params: { memo: this._memo },
      };
      this._instructionsData.push(memoData);
    }

    // Delegate to the clean WASM builder
    // Use _versionedTransactionData stored on builder (no web3 dependency)
    return buildWasmTransaction({
      coinConfig: this._coinConfig,
      feePayer: this._feePayer ?? this._sender,
      recentBlockhash: this._recentBlockhash,
      durableNonceParams: this._nonceInfo?.params,
      instructionsData: this._instructionsData,
      transactionType: this.transactionType,
      signers: this._signers,
      signatures: this._signatures.map((s) => ({ publicKey: s.publicKey.pub, signature: s.signature })),
      lamportsPerSignature: this._lamportsPerSignature,
      tokenAccountRentExemptAmount: this._tokenAccountRentExemptAmount,
      parsedTransaction: this._parsedWasmTransaction,
      addressLookupTables: this._versionedTransactionData?.addressLookupTables,
      staticAccountKeys: this._versionedTransactionData?.staticAccountKeys,
    });
  }

  /**
   * Build versioned transaction from raw MessageV0 data using WASM (testnet only).
   *
   * This handles the fromVersionedTransactionData() path where we have pre-compiled
   * versioned data (indexes + ALT refs). Delegates to wasm/builder.ts for clean separation.
   */
  private async buildVersionedWithWasm(): Promise<WasmTransaction> {
    assert(this._sender, new BuildTransactionError('sender is required before building'));

    // Use _versionedTransactionData stored on builder (no web3 dependency)
    if (!this._versionedTransactionData) {
      throw new BuildTransactionError('Missing versioned transaction data');
    }

    // Delegate to the clean WASM builder (all WASM logic lives in wasm/builder.ts)
    return buildVersionedWasmTransaction({
      coinConfig: this._coinConfig,
      versionedData: this._versionedTransactionData,
      recentBlockhash: this._recentBlockhash,
      durableNonceParams: this._nonceInfo?.params,
      transactionType: this.transactionType,
      instructionsData: this._instructionsData,
      signers: this._signers,
      signatures: this._signatures.map((s) => ({ publicKey: s.publicKey.pub, signature: s.signature })),
      lamportsPerSignature: this._lamportsPerSignature,
      tokenAccountRentExemptAmount: this._tokenAccountRentExemptAmount,
    });
  }

  /**
   * Build transaction using legacy @solana/web3.js (mainnet).
   */
  private async buildLegacy(): Promise<Transaction> {
    const builtTransaction = this.buildSolTransaction();

    if (builtTransaction instanceof VersionedTransaction) {
      this.transaction.versionedTransaction = builtTransaction;
    } else {
      this.transaction.solTransaction = builtTransaction;
    }

    this.transaction.setTransactionType(this.transactionType);
    this.transaction.setInstructionsData(this._instructionsData);
    this.transaction.loadInputsAndOutputs();
    this._transaction.tokenAccountRentExemptAmount = this._tokenAccountRentExemptAmount;
    return this.transaction;
  }

  /**
   * Builds the solana transaction.
   */
  protected buildSolTransaction(): SolTransaction | VersionedTransaction {
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(this._recentBlockhash, new BuildTransactionError('recent blockhash is required before building'));

    // Check if we should build as VersionedTransaction
    // Mainnet: reads from Transaction class (set by customInstructionBuilder)
    // Testnet: this path not used - WASM path reads from _versionedTransactionData
    if (this._transaction.isVersionedTransaction()) {
      return this.buildVersionedTransaction();
    } else {
      return this.buildLegacyTransaction();
    }
  }

  /**
   * Builds a legacy Solana transaction.
   */
  private buildLegacyTransaction(): SolTransaction {
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

  /**
   * Builds a VersionedTransaction.
   *
   * @returns {VersionedTransaction} The built versioned transaction
   */
  private buildVersionedTransaction(): VersionedTransaction {
    // Mainnet only: read from Transaction class (nonce already injected in customInstructionBuilder)
    const versionedTxData = this._transaction.getVersionedTransactionData();

    if (!versionedTxData) {
      throw new BuildTransactionError('Missing VersionedTransactionData');
    }

    const versionedTx = this.buildFromVersionedData(versionedTxData);

    this._transaction.lamportsPerSignature = this._lamportsPerSignature;

    for (const signer of this._signers) {
      const publicKey = new PublicKey(signer.getKeys().pub);
      const secretKey = signer.getKeys(true).prv;
      assert(secretKey instanceof Uint8Array);
      versionedTx.sign([{ publicKey, secretKey }]);
    }

    for (const signature of this._signatures) {
      const solPublicKey = new PublicKey(signature.publicKey.pub);
      versionedTx.addSignature(solPublicKey, signature.signature);
    }

    return versionedTx;
  }

  /**
   * Build a VersionedTransaction from deconstructed VersionedTransactionData
   * @param data The versioned transaction data
   * @returns The built versioned transaction
   */
  private buildFromVersionedData(data: SolVersionedTransactionData): VersionedTransaction {
    const staticAccountKeys = data.staticAccountKeys.map((key: string) => new PublicKey(key));

    const addressTableLookups: MessageAddressTableLookup[] = data.addressLookupTables.map((alt) => ({
      accountKey: new PublicKey(alt.accountKey),
      writableIndexes: alt.writableIndexes,
      readonlyIndexes: alt.readonlyIndexes,
    }));

    const compiledInstructions = data.versionedInstructions.map((instruction) => ({
      programIdIndex: instruction.programIdIndex,
      accountKeyIndexes: instruction.accountKeyIndexes,
      data: Buffer.from(base58.decode(instruction.data)),
    }));

    const recentBlockhash = data.recentBlockhash || this._recentBlockhash;

    if (!recentBlockhash) {
      throw new BuildTransactionError('Missing recent blockhash for VersionedTransaction');
    }

    if (!this._sender) {
      throw new BuildTransactionError('Missing sender (fee payer) for VersionedTransaction');
    }

    const messageV0 = new MessageV0({
      header: data.messageHeader,
      staticAccountKeys,
      recentBlockhash: recentBlockhash,
      compiledInstructions,
      addressTableLookups,
    });

    return new VersionedTransaction(messageV0);
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

  public setPriorityFee(feeOptions: FeeOptions): this {
    this._priorityFee = Number(feeOptions.amount);
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
