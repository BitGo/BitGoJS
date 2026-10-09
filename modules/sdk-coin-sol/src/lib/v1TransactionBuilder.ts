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
  SolVersionedTransactionData,
  TransactionType,
} from '@bitgo/sdk-core';
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
  Transaction as SolTransaction,
  TransactionInstruction,
} from '@solana/web3.js';
import base58 from 'bs58';
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
 * Map a v1 envelope instruction (index-based) into a web3.js TransactionInstruction
 * (address-based), deriving each referenced account's signer/writable role from the
 * message header (Solana role conventions: the last `numReadonlySignedAccounts`
 * signers and last `numReadonlyUnsignedAccounts` non-signers are readonly).
 *
 * @param instruction - the envelope instruction (programIdIndex/accountKeyIndexes/data)
 * @param data - the v1 envelope
 * @returns the address-based instruction, ready for V1TransactionBuilder.addInstruction
 */
export function toV1TransactionInstruction(
  instruction: { programIdIndex: number; accountKeyIndexes: number[]; data: string },
  data: SolVersionedTransactionData
): TransactionInstruction {
  const { staticAccountKeys, messageHeader } = data;
  const numRequiredSignatures = messageHeader.numRequiredSignatures;
  const numAccounts = staticAccountKeys.length;

  const isSigner = (index: number): boolean => index < numRequiredSignatures;
  const isWritable = (index: number): boolean =>
    isSigner(index)
      ? index < numRequiredSignatures - messageHeader.numReadonlySignedAccounts
      : index < numAccounts - messageHeader.numReadonlyUnsignedAccounts;

  return new TransactionInstruction({
    programId: new PublicKey(staticAccountKeys[instruction.programIdIndex]),
    keys: instruction.accountKeyIndexes.map((accountIndex) => ({
      pubkey: new PublicKey(staticAccountKeys[accountIndex]),
      isSigner: isSigner(accountIndex),
      isWritable: isWritable(accountIndex),
    })),
    data: Buffer.from(base58.decode(instruction.data)),
  });
}

/**
 * Inject an AdvanceNonceAccount instruction into a v1 envelope for durable nonce.
 *
 * v1 (SIMD-0296/0385) has no address lookup tables, so every account is a static
 * key. The nonce authority MUST sign the AdvanceNonceAccount instruction (hard
 * runtime requirement) and the nonce account MUST be writable; the system program
 * and recent-blockhashes sysvar are readonly non-signers. The instruction is
 * prepended and every instruction's account indexes are remapped to the rebuilt
 * static key list; messageHeader grows accordingly so the wire-size estimate and
 * account caps are correct.
 *
 * @param data - the v1 envelope (client-supplied, no nonce instruction)
 * @param durableNonceParams - walletNonceAddress + authWalletAddress (gas-tank root)
 * @returns a copy of the envelope with the nonce instruction injected
 * @edge if the envelope already contains an AdvanceNonceAccount instruction, returns
 *   the envelope unchanged (idempotent - a durable-aware client may supply it)
 */
export function injectV1NonceAdvanceInstruction(
  data: SolVersionedTransactionData,
  durableNonceParams: { walletNonceAddress: string; authWalletAddress: string }
): SolVersionedTransactionData {
  const { walletNonceAddress, authWalletAddress } = durableNonceParams;
  const SYSTEM_PROGRAM = SystemProgram.programId.toBase58();
  const SYSVAR_RECENT_BLOCKHASHES = SYSVAR_RECENT_BLOCKHASHES_PUBKEY.toBase58();

  // Idempotence: a durable-aware client may already include the nonce instruction.
  const hasNonceAdvance = data.versionedInstructions.some((instruction) => {
    const program = data.staticAccountKeys[instruction.programIdIndex];
    return program === SYSTEM_PROGRAM && Buffer.from(base58.decode(instruction.data))[0] === 4;
  });
  if (hasNonceAdvance) {
    return data;
  }

  const { numRequiredSignatures, numReadonlySignedAccounts, numReadonlyUnsignedAccounts } = data.messageHeader;
  const oldStaticLen = data.staticAccountKeys.length;
  if (
    numReadonlySignedAccounts > numRequiredSignatures ||
    numRequiredSignatures + numReadonlyUnsignedAccounts > oldStaticLen
  ) {
    throw new BuildTransactionError(
      `Invalid message header: readonly counts (${numReadonlySignedAccounts}, ${numReadonlyUnsignedAccounts}) ` +
        `are inconsistent with ${numRequiredSignatures} required signatures and ${oldStaticLen} static account keys`
    );
  }

  // Split the static keys into the four v1 header sections.
  const writableSigners = data.staticAccountKeys.slice(0, numRequiredSignatures - numReadonlySignedAccounts);
  const readonlySigners = data.staticAccountKeys.slice(
    numRequiredSignatures - numReadonlySignedAccounts,
    numRequiredSignatures
  );
  const writableNonSigners = data.staticAccountKeys.slice(
    numRequiredSignatures,
    oldStaticLen - numReadonlyUnsignedAccounts
  );
  const readonlyNonSigners = data.staticAccountKeys.slice(oldStaticLen - numReadonlyUnsignedAccounts);

  // The nonce authority must be a signer for AdvanceNonceAccount.
  const authorityIsSigner = writableSigners.includes(authWalletAddress) || readonlySigners.includes(authWalletAddress);
  if (!authorityIsSigner) {
    const asReadonlyNonSigner = readonlyNonSigners.indexOf(authWalletAddress);
    const asWritableNonSigner = writableNonSigners.indexOf(authWalletAddress);
    if (asReadonlyNonSigner >= 0) {
      readonlyNonSigners.splice(asReadonlyNonSigner, 1);
      readonlySigners.push(authWalletAddress);
    } else if (asWritableNonSigner >= 0) {
      writableNonSigners.splice(asWritableNonSigner, 1);
      writableSigners.push(authWalletAddress);
    } else {
      readonlySigners.push(authWalletAddress);
    }
  }

  // The nonce account must be writable for AdvanceNonceAccount.
  const nonceAsReadonlyNonSigner = readonlyNonSigners.indexOf(walletNonceAddress);
  const nonceAsReadonlySigner = readonlySigners.indexOf(walletNonceAddress);
  if (nonceAsReadonlyNonSigner >= 0) {
    readonlyNonSigners.splice(nonceAsReadonlyNonSigner, 1);
    writableNonSigners.push(walletNonceAddress);
  } else if (nonceAsReadonlySigner >= 0) {
    readonlySigners.splice(nonceAsReadonlySigner, 1);
    writableSigners.push(walletNonceAddress);
  } else if (!writableSigners.includes(walletNonceAddress) && !writableNonSigners.includes(walletNonceAddress)) {
    writableNonSigners.push(walletNonceAddress);
  }

  // The system program and recent-blockhashes sysvar are readonly non-signers.
  const isPresent = (key: string) =>
    writableSigners.includes(key) ||
    readonlySigners.includes(key) ||
    writableNonSigners.includes(key) ||
    readonlyNonSigners.includes(key);
  if (!isPresent(SYSTEM_PROGRAM)) {
    readonlyNonSigners.push(SYSTEM_PROGRAM);
  }
  if (!isPresent(SYSVAR_RECENT_BLOCKHASHES)) {
    readonlyNonSigners.push(SYSVAR_RECENT_BLOCKHASHES);
  }

  const newStaticAccountKeys = [...writableSigners, ...readonlySigners, ...writableNonSigners, ...readonlyNonSigners];

  // Remap every instruction index to the new key order (v1 has no lookup tables).
  const indexMap = new Map<number, number>();
  data.staticAccountKeys.forEach((key, oldIdx) => indexMap.set(oldIdx, newStaticAccountKeys.indexOf(key)));
  const remapIndex = (index: number): number => {
    const mapped = indexMap.get(index);
    if (mapped === undefined) {
      throw new BuildTransactionError(`Invalid account key index ${index} in versioned instruction`);
    }
    return mapped;
  };

  const nonceAdvanceInstruction = {
    programIdIndex: newStaticAccountKeys.indexOf(SYSTEM_PROGRAM),
    accountKeyIndexes: [
      newStaticAccountKeys.indexOf(walletNonceAddress),
      newStaticAccountKeys.indexOf(SYSVAR_RECENT_BLOCKHASHES),
      newStaticAccountKeys.indexOf(authWalletAddress),
    ],
    data: '6vx8P', // base58 of SystemProgram AdvanceNonceAccount (0x04000000)
  };

  return {
    ...data,
    versionedInstructions: [
      nonceAdvanceInstruction,
      ...data.versionedInstructions.map((instruction) => ({
        programIdIndex: remapIndex(instruction.programIdIndex),
        accountKeyIndexes: instruction.accountKeyIndexes.map(remapIndex),
        data: instruction.data,
      })),
    ],
    staticAccountKeys: newStaticAccountKeys,
    messageHeader: {
      numRequiredSignatures: writableSigners.length + readonlySigners.length,
      numReadonlySignedAccounts: readonlySigners.length,
      numReadonlyUnsignedAccounts: readonlyNonSigners.length,
    },
  };
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
/**
 * Input shape for {@link V1TransactionBuilder.transactionConfig}: all fields optional;
 * unset values are coerced to null (the SDK v1 serializer contract).
 */
export type V1TransactionConfigInput = {
  computeUnitLimit?: number;
  heapSize?: number;
  loadedAccountsDataSizeLimit?: number;
  priorityFee?: number;
};

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
    tx.setTransactionType(this.transactionType);
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
  transactionConfig(config: V1TransactionConfigInput): this {
    this._transactionConfig = {
      computeUnitLimit: config.computeUnitLimit ?? null,
      heapSize: config.heapSize ?? null,
      loadedAccountsDataSizeLimit: config.loadedAccountsDataSizeLimit ?? null,
      priorityFee: config.priorityFee ?? null,
    };
    return this;
  }

  /**
   * Initialize the builder from a client-supplied v1 envelope
   * (SolVersionedTransactionData). Sets the fee payer from staticAccountKeys[0],
   * coerces the transaction config, and converts each envelope instruction to an
   * address-based TransactionInstruction via {@link toV1TransactionInstruction}.
   *
   * @param data - the v1 envelope
   * @returns {V1TransactionBuilder} This transaction builder
   */
  fromVersionedData(data: SolVersionedTransactionData): this {
    if (!data || typeof data !== 'object') {
      throw new BuildTransactionError('VersionedTransactionData must be a valid object');
    }
    if (!Array.isArray(data.staticAccountKeys) || data.staticAccountKeys.length === 0) {
      throw new BuildTransactionError('staticAccountKeys must be a non-empty array');
    }
    if (!Array.isArray(data.versionedInstructions)) {
      throw new BuildTransactionError('versionedInstructions must be an array');
    }
    if (!data.messageHeader || typeof data.messageHeader !== 'object') {
      throw new BuildTransactionError('messageHeader must be a valid object');
    }
    this._sender = data.staticAccountKeys[0];
    this._transactionConfig = {
      computeUnitLimit: data.transactionConfig?.computeUnitLimit ?? null,
      heapSize: data.transactionConfig?.heapSize ?? null,
      loadedAccountsDataSizeLimit: data.transactionConfig?.loadedAccountsDataSizeLimit ?? null,
      priorityFee: data.transactionConfig?.priorityFee ?? null,
    };
    for (const instruction of data.versionedInstructions) {
      this.addInstruction(toV1TransactionInstruction(instruction, data));
    }
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
