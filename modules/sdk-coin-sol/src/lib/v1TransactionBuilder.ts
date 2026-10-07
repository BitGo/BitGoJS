import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  BaseAddress,
  BaseKey,
  BaseTransactionBuilder,
  BuildTransactionError,
  FeeOptions,
  PublicKey as BasePublicKey,
  SigningError,
  SolV1TransactionConfig,
  TransactionType,
} from '@bitgo/sdk-core';
import { PublicKey, SystemProgram, Transaction as SolTransaction, TransactionInstruction } from '@solana/web3.js';
import nacl from 'tweetnacl';
import assert from 'assert';
import { Transaction } from './transaction';
import { InstructionBuilderTypes } from './constants';
import { InstructionParams, Memo, Nonce } from './iface';
import { solInstructionFactory } from './solInstructionFactory';
import { compileTransactionMessage } from './serialization/compileTransactionMessage';
import { serializeWireTransaction } from './serialization/wire-transaction';
import { parseWireTransaction } from './serialization/parseWireTransaction';
import { decodeV1Message } from './serialization/codecs/v1/message';
import { isValidAddress, isValidBlockId, isValidMemo, validateAddress } from './utils';
import { KeyPair } from './keyPair';

/**
 * Construct an AdvanceNonceAccount instruction for a durable nonce.
 *
 * The v0 path receives this instruction from web3.js / the Rust wasm core
 * (`NonceSource` durable variant); the v1 path compiles via
 * `compileTransactionMessage`, so the nonce instruction must be constructed in
 * TypeScript and injected into the compile input. The nonce authority
 * (`authWalletAddress`) MUST sign the instruction — it becomes a required
 * signer of the compiled message.
 *
 * @param nonceAddress - the durable nonce account address
 * @param authWalletAddress - the nonce authority (gas-tank root in BitGo's model)
 * @returns the AdvanceNonceAccount instruction
 */
export function buildAdvanceNonceAccountInstruction(
  nonceAddress: string,
  authWalletAddress: string
): TransactionInstruction {
  assert(nonceAddress, 'Missing nonceAddress param');
  assert(authWalletAddress, 'Missing authWalletAddress param');
  return SystemProgram.nonceAdvance({
    noncePubkey: new PublicKey(nonceAddress),
    authorizedPubkey: new PublicKey(authWalletAddress),
  });
}

/**
 * Base builder for Solana v1 (SIMD-0296/0385) transactions.
 *
 * Parallel to the v0 {@link TransactionBuilder}, which is bound to a
 * `@solana/web3.js` v0 `Transaction` and cannot emit a v1 wire. This builder
 * owns the v1 assembly:
 *
 * - intent-to-instruction derivation via the shared `solInstructionFactory`
 *   (same `InstructionParams` representation as the v0 flows)
 * - durable nonce: `AdvanceNonceAccount` instruction injection (first) plus the
 *   nonce hash in the blockhash field
 * - transaction config (compute unit limit, heap size, loaded accounts data
 *   size limit, priority fee as total lamports)
 * - signer management: private-key signers (`sign`) and external signatures
 *   (`addSignature`), assembled in message-signer order
 * - message compile via `compileTransactionMessage` and signed wire via
 *   `serializeWireTransaction`
 *
 * Signature assembly is in message-signer order (fee payer first, then the
 * remaining signers in the compiled account order), NOT insertion order —
 * required for multi-signer v1 transactions such as durable-nonce CT
 * (user + gas-tank nonce authority). Missing signatures are zero-filled in
 * their slots so the wire shape stays valid for partial-sign flows; the
 * broadcastable wire is only produced once every required signer has a
 * signature.
 */
export abstract class V1TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  private _instructionsData: InstructionParams[] = [];
  private _extraInstructions: TransactionInstruction[] = [];
  private _signers: KeyPair[] = [];
  private _signatures: Map<string, Uint8Array> = new Map();
  private _lamportsPerSignature: number;

  protected _sender: string;
  protected _feePayer?: string;
  protected _recentBlockhash: string;
  protected _nonceInfo?: Nonce;
  protected _memo?: string;
  protected _transactionConfig?: SolV1TransactionConfig;
  /** Optional override for the zk-elgamal-proof program id (used by CT instruction builders) */
  protected _zkProofProgramId?: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction = new Transaction(_coinConfig);
  }

  /**
   * The transaction type.
   */
  protected abstract get transactionType(): TransactionType;

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    return this.buildV1();
  }

  /**
   * Assemble the v1 transaction: derive instructions, inject the durable-nonce
   * instruction when present, compile the message, and assemble the signed
   * wire in message-signer order.
   *
   * @returns {Transaction} The built transaction holding the v1 message and wire bytes
   */
  private buildV1(): Transaction {
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(this._recentBlockhash, new BuildTransactionError('recent blockhash is required before building'));
    assert(this._transactionConfig, 'transactionConfig is required to build a v1 transaction');

    const instructions: TransactionInstruction[] = [];

    // Durable nonce: the AdvanceNonceAccount instruction MUST be part of the
    // message (a bare nonce hash without the instruction is invalid). It is
    // placed first, matching the v0 web3.js convention.
    if (this._nonceInfo) {
      instructions.push(
        buildAdvanceNonceAccountInstruction(
          this._nonceInfo.params.walletNonceAddress,
          this._nonceInfo.params.authWalletAddress
        )
      );
    }

    for (const instruction of this._instructionsData) {
      instructions.push(...solInstructionFactory(instruction, this._zkProofProgramId));
    }

    if (this._memo) {
      const memoData: Memo = {
        type: InstructionBuilderTypes.Memo,
        params: { memo: this._memo },
      };
      this._instructionsData.push(memoData);
      instructions.push(...solInstructionFactory(memoData));
    }

    instructions.push(...this._extraInstructions);

    const feePayer = this._feePayer ? new PublicKey(this._feePayer) : new PublicKey(this._sender);
    const messageBytes = compileTransactionMessage({
      version: 1,
      instructions,
      feePayer,
      recentBlockhash: this._recentBlockhash,
      transactionConfig: this._transactionConfig,
    });

    // Signer order comes from the compiled message: the first
    // numSignerAccounts static accounts are the required signers (fee payer
    // first, then the remaining signers in the compiled account order).
    const decoded = decodeV1Message(messageBytes);
    const signerAddresses = decoded.staticAccounts.slice(0, decoded.header.numSignerAccounts);

    const signatures: Uint8Array[] = [];
    for (const address of signerAddresses) {
      const keyPair = this._signers.find((signer) => signer.getKeys().pub === address);
      if (keyPair) {
        const secretKey = keyPair.getKeys(true).prv;
        assert(secretKey instanceof Uint8Array, 'Missing private key');
        signatures.push(nacl.sign.detached(messageBytes, secretKey));
        continue;
      }
      const external = this._signatures.get(address);
      if (external) {
        signatures.push(external);
        continue;
      }
      // Missing signature: zero-fill the slot so the wire shape stays valid
      // for partial-sign flows; the transaction is not broadcastable until
      // every required signer has a signature.
      signatures.push(new Uint8Array(64));
    }

    const v1Wire = serializeWireTransaction(messageBytes, signatures);

    this._transaction.v1TransactionBytes = v1Wire;
    this._transaction.v1MessageBytes = messageBytes;
    this._transaction.lamportsPerSignature = this._lamportsPerSignature;

    // Populate a metadata-only SolTransaction so toJson / loadInputsAndOutputs
    // work. The durable nonce is carried via nonceInfo, matching the v0 model.
    const metaTx = new SolTransaction();
    metaTx.feePayer = feePayer;
    metaTx.recentBlockhash = this._recentBlockhash;
    if (this._nonceInfo) {
      metaTx.nonceInfo = {
        nonce: this._recentBlockhash,
        nonceInstruction: buildAdvanceNonceAccountInstruction(
          this._nonceInfo.params.walletNonceAddress,
          this._nonceInfo.params.authWalletAddress
        ),
      };
    }
    metaTx.add(...instructions);
    this._transaction.solTransaction = metaTx;

    this._transaction.setTransactionType(this.transactionType);
    this._transaction.setInstructionsData(this._instructionsData);
    this._transaction.loadInputsAndOutputs();

    return this._transaction;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = new Transaction(this._coinConfig);
    const wireBytes = new Uint8Array(Buffer.from(rawTransaction, 'base64'));
    const { messageBytes } = parseWireTransaction(wireBytes);
    tx.v1TransactionBytes = wireBytes;
    tx.v1MessageBytes = messageBytes;

    // Populate a metadata-only SolTransaction from the decoded message so
    // toJson / loadInputsAndOutputs work.
    const decoded = decodeV1Message(messageBytes);
    const metaTx = new SolTransaction();
    metaTx.feePayer = new PublicKey(decoded.staticAccounts[0]);
    metaTx.recentBlockhash = decoded.blockhash;
    const numWritableSigners = decoded.header.numSignerAccounts - decoded.header.numReadonlySignerAccounts;
    const numWritableNonSigners = decoded.staticAccounts.length - decoded.header.numReadonlyNonSignerAccounts;
    for (const compiled of decoded.compiledInstructions) {
      metaTx.add(
        new TransactionInstruction({
          programId: new PublicKey(decoded.staticAccounts[compiled.programAddressIndex]),
          keys: compiled.accountIndices.map((index) => ({
            pubkey: new PublicKey(decoded.staticAccounts[index]),
            isSigner: index < decoded.header.numSignerAccounts,
            isWritable:
              index < numWritableSigners ||
              (index >= decoded.header.numSignerAccounts && index < numWritableNonSigners),
          })),
          data: Buffer.from(compiled.data),
        })
      );
    }
    tx.solTransaction = metaTx;

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
    this._signatures.set(publicKey.pub, new Uint8Array(signature));
  }

  /**
   * Sets the sender of this transaction.
   * This account will be responsible for paying transaction fees.
   *
   * @param {string} senderAddress the account that is sending this transaction
   * @returns {V1TransactionBuilder} This transaction builder
   */
  sender(senderAddress: string): this {
    validateAddress(senderAddress, 'sender');
    this._sender = senderAddress;
    return this;
  }

  /**
   * Set the transaction nonce.
   * Requires both optional params in order to use the durable nonce.
   *
   * @param {string} blockHash The latest blockHash or the durable nonce hash
   * @param {DurableNonceParams} [durableNonceParams] An object containing the walletNonceAddress and the authWalletAddress (required for durable nonce)
   * @returns {V1TransactionBuilder} This transaction builder
   */
  nonce(blockHash: string, durableNonceParams?: { walletNonceAddress: string; authWalletAddress: string }): this {
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
   * Set the intent instructions to build, using the shared instruction params
   * representation consumed by `solInstructionFactory` (same as the v0 flows).
   *
   * @param {InstructionParams[]} instructions the instruction params
   * @returns {V1TransactionBuilder} This transaction builder
   */
  instructions(instructions: InstructionParams[]): this {
    this._instructionsData = [...instructions];
    return this;
  }

  /**
   * Append a pre-built instruction (e.g. an envelope-derived instruction or a
   * custom instruction) to the transaction.
   *
   * @param {TransactionInstruction} instruction the instruction to append
   * @returns {V1TransactionBuilder} This transaction builder
   */
  addInstruction(instruction: TransactionInstruction): this {
    this._extraInstructions.push(instruction);
    return this;
  }

  /**
   * Set the v1 transaction config (compute unit limit, heap size, loaded
   * accounts data size limit, and priority fee as total lamports). Required
   * before building.
   *
   * @param {SolV1TransactionConfig} config the v1 transaction config
   * @returns {V1TransactionBuilder} This transaction builder
   */
  transactionConfig(config: SolV1TransactionConfig): this {
    this._transactionConfig = config;
    return this;
  }

  /**
   * Set the priority fee (total lamports) on the v1 transaction config.
   *
   * @param {FeeOptions} feeOptions the priority fee
   * @returns {V1TransactionBuilder} This transaction builder
   */
  setPriorityFee(feeOptions: FeeOptions): this {
    if (!this._transactionConfig) {
      this._transactionConfig = {
        computeUnitLimit: null,
        heapSize: null,
        loadedAccountsDataSizeLimit: null,
        priorityFee: null,
      };
    }
    this._transactionConfig.priorityFee = Number(feeOptions.amount);
    return this;
  }

  /**
   * Set the fee (lamports per signature) for fee estimation.
   *
   * @param {FeeOptions} feeOptions the fee
   * @returns {V1TransactionBuilder} This transaction builder
   */
  fee(feeOptions: FeeOptions): this {
    this._lamportsPerSignature = Number(feeOptions.amount);
    return this;
  }

  feePayer(feePayer: string): this {
    this._feePayer = feePayer;
    return this;
  }

  /**
   * Set the memo.
   *
   * @param {string} memo
   * @returns {V1TransactionBuilder} This transaction builder
   */
  memo(memo: string): this {
    this.validateMemo(memo);
    this._memo = memo;
    return this;
  }

  /**
   * Override the zk-elgamal-proof program id.
   *
   * Defaults to the canonical on-chain program id (`ZkE1Gama1Proof111...`)
   * which is the same across mainnet, devnet, and testnet. Override only
   * when targeting a custom deployment.
   *
   * @param {string} programId base58 encoded program id
   * @returns {V1TransactionBuilder} This transaction builder
   */
  zkProofProgramId(programId: string): this {
    assert(programId, 'Missing programId param');
    this._zkProofProgramId = programId;
    return this;
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
    if (!rawTransaction) {
      throw new BuildTransactionError('Invalid raw transaction');
    }
    try {
      parseWireTransaction(new Uint8Array(Buffer.from(rawTransaction, 'base64')));
    } catch (e) {
      throw new BuildTransactionError('Invalid raw transaction: ' + (e as Error).message);
    }
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    this.validateSender();
    this.validateNonce();
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  /**
   * Validates the memo.
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
   * Validates that the given key is not already in this._signers.
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
   * Validates that the sender field is defined.
   */
  private validateSender(): void {
    if (this._sender === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing sender');
    }
  }

  /**
   * Validates that the nonce field is defined.
   */
  private validateNonce(): void {
    if (this._recentBlockhash === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing nonce blockhash');
    }
  }
  // endregion
}
