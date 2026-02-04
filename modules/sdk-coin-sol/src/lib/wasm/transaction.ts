/**
 * Clean WASM-only Transaction implementation.
 *
 * This class provides transaction parsing and serialization using only
 * @bitgo/wasm-solana, with zero @solana/web3.js dependencies.
 */
import {
  BaseTransaction,
  Entry,
  InvalidTransactionError,
  ParseTransactionError,
  SigningError,
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  parseTransaction,
  Transaction as WasmSolanaTransaction,
  VersionedTransaction as WasmVersionedTransaction,
  ParsedTransaction as WasmParsedTransaction,
  // Program ID exports (eliminates hardcoded strings)
  ataProgramId,
  tokenProgramId,
  // Types for building from raw versioned data
  RawVersionedTransactionData,
} from '@bitgo/wasm-solana';
import * as nacl from 'tweetnacl';
import base58 from 'bs58';
import { SolStakingTypeEnum } from '@bitgo/public-types';
import { combineWasmInstructionsFromBytes } from '../wasmInstructionCombiner';
import { InstructionBuilderTypes, UNAVAILABLE_TEXT } from '../constants';
import {
  DurableNonceParams,
  InstructionParams,
  StakingDeactivate,
  TxData,
  TransactionExplanation,
  VersionedTransactionData,
} from '../iface';
import { KeyPair } from '../keyPair';

/**
 * Solana transaction using WASM for all parsing operations.
 *
 * Key differences from legacy Transaction:
 * - No @solana/web3.js dependency
 * - No conditional code paths
 * - ~150 lines instead of 800+
 */
export class WasmTransaction extends BaseTransaction {
  private _wasmTransaction: WasmSolanaTransaction | WasmVersionedTransaction | undefined;
  private _parsedTransaction: WasmParsedTransaction | undefined;
  private _rawTransaction: string | undefined;
  private _lamportsPerSignature: number | undefined;
  private _tokenAccountRentExemptAmount: string | undefined;
  // Store the raw versioned instruction data for getVersionedTransactionData()
  private _versionedInstructions:
    | Array<{ programIdIndex: number; accountKeyIndexes: number[]; data: string }>
    | undefined;
  protected _type: TransactionType;
  protected _instructionsData: InstructionParams[] = [];

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  // =============================================================================
  // Core Properties
  // =============================================================================

  /** Transaction type */
  get type(): TransactionType {
    return this._type;
  }

  /** Transaction ID (first signature, base58 encoded) */
  get id(): string {
    if (!this._wasmTransaction) return UNAVAILABLE_TEXT;
    const signatures = this._wasmTransaction.signatures;
    if (signatures.length > 0) {
      const firstSig = signatures[0];
      // Check if signature is not a placeholder (all zeros)
      if (firstSig.some((b) => b !== 0)) {
        return base58.encode(firstSig);
      }
    }
    return UNAVAILABLE_TEXT;
  }

  /** Message bytes that need to be signed */
  get signablePayload(): Buffer {
    if (!this._wasmTransaction) {
      throw new InvalidTransactionError('Transaction not initialized');
    }
    return Buffer.from(this._wasmTransaction.signablePayload());
  }

  /** List of valid signatures (non-placeholder) */
  get signature(): string[] {
    if (!this._wasmTransaction) return [];
    return this._wasmTransaction.signatures.filter((sig) => sig.some((b) => b !== 0)).map((sig) => base58.encode(sig));
  }

  /**
   * Get all signatures paired with their signer public keys.
   * Returns only non-placeholder signatures.
   */
  getSignaturesWithPublicKeys(): Array<{ publicKey: string; signature: Uint8Array }> {
    if (!this._wasmTransaction || !this._parsedTransaction) return [];

    const rawSignatures = this._wasmTransaction.signatures;
    const accountKeys = this._parsedTransaction.accountKeys || [];
    const result: Array<{ publicKey: string; signature: Uint8Array }> = [];

    // First N account keys are signers (where N = number of signatures)
    for (let i = 0; i < rawSignatures.length && i < accountKeys.length; i++) {
      const sig = rawSignatures[i];
      // Skip placeholder signatures (all zeros)
      if (sig.some((b) => b !== 0)) {
        result.push({
          publicKey: accountKeys[i],
          signature: sig,
        });
      }
    }

    return result;
  }

  get lamportsPerSignature(): number | undefined {
    return this._lamportsPerSignature;
  }

  set lamportsPerSignature(value: number | undefined) {
    this._lamportsPerSignature = value;
  }

  get tokenAccountRentExemptAmount(): string | undefined {
    return this._tokenAccountRentExemptAmount;
  }

  set tokenAccountRentExemptAmount(value: string | undefined) {
    this._tokenAccountRentExemptAmount = value;
  }

  /** Parsed instruction data */
  get instructionsData(): InstructionParams[] {
    return this._instructionsData;
  }

  /**
   * Get the underlying WASM transaction.
   * Provides access to the wasm-solana Transaction for low-level operations.
   * Returns either Transaction (legacy) or VersionedTransaction (MessageV0).
   */
  get solTransaction(): WasmSolanaTransaction | WasmVersionedTransaction {
    if (!this._wasmTransaction) {
      throw new InvalidTransactionError('Transaction not initialized');
    }
    return this._wasmTransaction;
  }

  /**
   * Check if this transaction is a VersionedTransaction (MessageV0).
   * @returns True if using the versioned transaction format
   */
  isVersionedTransaction(): boolean {
    if (!this._wasmTransaction) return false;
    // WasmVersionedTransaction is the versioned type
    return this._wasmTransaction instanceof WasmVersionedTransaction;
  }

  /**
   * Get the versioned transaction data if available.
   * Used for reconstructing versioned transactions.
   */
  getVersionedTransactionData(): VersionedTransactionData | undefined {
    if (!this._wasmTransaction || !(this._wasmTransaction instanceof WasmVersionedTransaction)) {
      return undefined;
    }

    // Use stored versioned instructions if available (from fromVersionedData()),
    // otherwise extract from parsed transaction (from round-trip parsing)
    let versionedInstructions: Array<{
      programIdIndex: number;
      accountKeyIndexes: number[];
      data: string;
    }>;

    if (this._versionedInstructions) {
      // Use the stored versioned instructions directly
      versionedInstructions = this._versionedInstructions;
    } else {
      // Fallback: Extract from parsed transaction for round-trip scenarios
      // Note: VersionedCustomInstruction is not a WASM parsed type, so this is primarily
      // for future use if we ever need to extract raw instructions from parsed data.
      versionedInstructions = [];
      if (this._parsedTransaction?.instructionsData) {
        for (const instr of this._parsedTransaction.instructionsData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((instr as any).type === 'VersionedCustomInstruction') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const customInstr = instr as any;
            versionedInstructions.push({
              programIdIndex: customInstr.programIdIndex as number,
              accountKeyIndexes: customInstr.accountKeyIndexes as number[],
              data: customInstr.data as string,
            });
          }
        }
      }
    }

    // Return the complete versioned transaction data
    return {
      staticAccountKeys: this._wasmTransaction.staticAccountKeys(),
      addressLookupTables: this._wasmTransaction.addressLookupTables().map((alt) => ({
        accountKey: alt.accountKey,
        writableIndexes: Array.from(alt.writableIndexes || []),
        readonlyIndexes: Array.from(alt.readonlyIndexes || []),
      })),
      versionedInstructions,
      messageHeader: {
        numRequiredSignatures: this._wasmTransaction.numSignatures,
        numReadonlySignedAccounts: 0, // Not directly available, would need to be stored
        numReadonlyUnsignedAccounts: 0, // Not directly available, would need to be stored
      },
      recentBlockhash: this._wasmTransaction.recentBlockhash,
    };
  }

  // =============================================================================
  // Parsing
  // =============================================================================

  /**
   * Parse a raw transaction from base64.
   * @param rawTransaction - Base64 encoded transaction
   */
  fromRawTransaction(rawTransaction: string): void {
    try {
      this._rawTransaction = rawTransaction;
      const txBytes = Buffer.from(rawTransaction, 'base64');

      // Parse with WASM
      this._wasmTransaction = WasmSolanaTransaction.fromBytes(txBytes);
      this._parsedTransaction = parseTransaction(txBytes);

      // Get transaction ID if signed
      const signatures = this._wasmTransaction.signatures;
      if (signatures.length > 0 && signatures[0].some((b) => b !== 0)) {
        this._id = base58.encode(signatures[0]);
      }

      // Derive transaction type and instructions using mapper (NO @solana/web3.js!)
      const { transactionType, instructions } = combineWasmInstructionsFromBytes(txBytes);
      this._type = transactionType;
      this._instructionsData = instructions;

      // Load inputs and outputs from instructions
      this.loadInputsAndOutputs();
    } catch (e) {
      throw new ParseTransactionError(`Failed to parse transaction: ${e}`);
    }
  }

  /**
   * Initialize from WASM-built transaction bytes.
   * Used when building transactions via WASM (not parsing existing ones).
   *
   * @param bytes - Transaction bytes from WASM builder
   * @param transactionType - The transaction type
   * @param instructionsData - The instruction data used to build this transaction
   */
  fromBuiltBytes(bytes: Uint8Array, transactionType: TransactionType, instructionsData: InstructionParams[]): void {
    try {
      this._wasmTransaction = WasmSolanaTransaction.fromBytes(bytes);
      this._parsedTransaction = parseTransaction(bytes);
      this._type = transactionType;

      // Normalize instructions to match legacy parser behavior:
      // CreateAssociatedTokenAccount should have programId = ATA Program ID
      // TokenTransfer should have programId = Token Program ID
      const ATA_PROGRAM_ID = ataProgramId();
      const TOKEN_PROGRAM_ID = tokenProgramId();
      this._instructionsData = instructionsData.map((instr) => {
        if (instr.type === InstructionBuilderTypes.CreateAssociatedTokenAccount) {
          return {
            ...instr,
            params: {
              ...instr.params,
              programId: ATA_PROGRAM_ID,
            },
          };
        }
        if (instr.type === InstructionBuilderTypes.TokenTransfer) {
          return {
            ...instr,
            params: {
              ...instr.params,
              programId: TOKEN_PROGRAM_ID,
            },
          };
        }
        return instr;
      });

      // Load inputs and outputs from instructions
      this.loadInputsAndOutputs();
    } catch (e) {
      throw new ParseTransactionError(`Failed to initialize from bytes: ${e}`);
    }
  }

  /**
   * Initialize from raw versioned transaction data (MessageV0 format).
   * Used for the fromVersionedTransactionData() path where we have pre-compiled
   * versioned data (indexes + ALT refs).
   *
   * @param data - Raw versioned transaction data
   * @param transactionType - The transaction type
   * @param instructionsData - The instruction data (VersionedCustomInstruction type)
   */
  fromVersionedData(
    data: RawVersionedTransactionData,
    transactionType: TransactionType,
    instructionsData: InstructionParams[]
  ): void {
    try {
      // Build the versioned transaction using WASM
      // Use VersionedTransaction.fromVersionedData() for MessageV0 format
      this._wasmTransaction = WasmVersionedTransaction.fromVersionedData(data);
      const bytes = this._wasmTransaction.toBytes();
      this._parsedTransaction = parseTransaction(bytes);
      this._type = transactionType;
      this._instructionsData = instructionsData;

      // Store the versioned instructions for getVersionedTransactionData()
      this._versionedInstructions = data.versionedInstructions;

      // Load inputs and outputs from instructions
      this.loadInputsAndOutputs();
    } catch (e) {
      throw new ParseTransactionError(`Failed to build from versioned data: ${e}`);
    }
  }

  // =============================================================================
  // Signing
  // =============================================================================

  /**
   * Check if a key can sign this transaction.
   * Matches legacy Transaction behavior - always returns true.
   */
  canSign(): boolean {
    return true;
  }

  /**
   * Sign the transaction with one or more keypairs.
   *
   * @param keyPair - Single keypair or array of keypairs to sign with
   */
  async sign(keyPair: KeyPair[] | KeyPair): Promise<void> {
    if (!this._wasmTransaction) {
      throw new SigningError('Transaction not initialized');
    }

    const keyPairs = keyPair instanceof Array ? keyPair : [keyPair];
    const messageToSign = this._wasmTransaction.signablePayload();

    for (const kp of keyPairs) {
      const keys = kp.getKeys(true);
      if (!keys.prv) {
        throw new SigningError('Missing private key');
      }
      const secretKey = keys.prv as Uint8Array;
      const signature = nacl.sign.detached(messageToSign, secretKey);
      this._wasmTransaction.addSignature(keys.pub, signature);
    }
  }

  /**
   * Add a pre-computed signature to the transaction.
   *
   * @param publicKey - The public key as base58 string
   * @param signature - The 64-byte signature
   */
  addSignature(publicKey: string, signature: Uint8Array): void {
    if (!this._wasmTransaction) {
      throw new SigningError('Transaction not initialized');
    }
    this._wasmTransaction.addSignature(publicKey, signature);
  }

  /**
   * COMPATIBILITY SHIM - Remove when legacy code is deleted.
   *
   * Filter out NonceAdvance instruction from instructionsData.
   * Used by the builder's round-trip path to match the behavior of buildUnsignedWithWasm,
   * which passes durableNonceParams separately instead of including NonceAdvance in instructionsData.
   *
   * Legacy builder: NonceAdvance stored in tx.nonceInfo, not in _instructionsData
   * WASM parser: Includes NonceAdvance in instructionsData (the correct behavior)
   *
   * This filter exists purely for backwards compatibility with tests expecting legacy format.
   *
   * TODO(BTC-2955): Remove this method when legacy Transaction class is deleted.
   * The WASM behavior (including NonceAdvance in instructionsData) is actually correct.
   * Steps to remove:
   * 1. Delete legacy transaction.ts
   * 2. Update tests to expect NonceAdvance in instructionsData
   * 3. Delete this method and all calls to it
   */
  filterNonceAdvanceFromInstructions(): void {
    this._instructionsData = this._instructionsData.filter(
      (instr) => instr.type !== InstructionBuilderTypes.NonceAdvance
    );
  }

  /**
   * COMPATIBILITY SHIM - Remove when legacy code is deleted.
   *
   * Filter out the rent-funding Transfer for partial staking deactivate.
   * Legacy Transaction.toJson() re-parses and combines this Transfer into the StakingDeactivate,
   * so we filter it out to match that behavior.
   *
   * The rent-funding Transfer is identified by:
   * - type: Transfer
   * - amount: STAKE_ACCOUNT_RENT_EXEMPT_AMOUNT (2282880)
   * - followed by a StakingDeactivate with matching unstakingAddress
   *
   * This filter exists purely for backwards compatibility with tests expecting legacy format.
   * The WASM output (with the Transfer visible) is actually more accurate.
   *
   * TODO(BTC-2955): Remove this method when legacy Transaction class is deleted.
   * The WASM behavior (showing the rent Transfer) is actually more accurate/transparent.
   * Steps to remove:
   * 1. Delete legacy transaction.ts
   * 2. Update tests to expect the rent-funding Transfer in partial deactivate
   * 3. Delete this method and all calls to it
   */
  filterRentFundingTransferForPartialDeactivate(): void {
    const STAKE_ACCOUNT_RENT_EXEMPT_AMOUNT = '2282880';

    // Find StakingDeactivate instruction with unstakingAddress (partial deactivate)
    const deactivateInstr = this._instructionsData.find(
      (instr): instr is StakingDeactivate =>
        instr.type === InstructionBuilderTypes.StakingDeactivate && instr.params.unstakingAddress !== undefined
    );

    if (!deactivateInstr) {
      return; // Not a partial deactivate
    }

    // Filter out Transfer instructions that fund the unstaking address
    this._instructionsData = this._instructionsData.filter((instr) => {
      if (instr.type !== InstructionBuilderTypes.Transfer) {
        return true; // Keep non-Transfer instructions
      }
      // Filter out the rent-funding Transfer
      const isRentFundingTransfer =
        instr.params.amount === STAKE_ACCOUNT_RENT_EXEMPT_AMOUNT &&
        instr.params.toAddress === deactivateInstr.params.unstakingAddress;
      return !isRentFundingTransfer;
    });
  }

  // =============================================================================
  // Serialization
  // =============================================================================

  /** Convert to JSON representation */
  toJson(): TxData {
    if (!this._parsedTransaction || !this._wasmTransaction) {
      throw new ParseTransactionError('Transaction not initialized');
    }

    // Detect durable nonce from instructions
    // Note: wasm-solana DurableNonce already uses walletNonceAddress/authWalletAddress
    const durableNonce: DurableNonceParams | undefined = this._parsedTransaction.durableNonce;

    return {
      id: this.id !== UNAVAILABLE_TEXT ? this.id : undefined,
      feePayer: this._parsedTransaction.feePayer,
      lamportsPerSignature: this._lamportsPerSignature,
      nonce: this._parsedTransaction.nonce,
      durableNonce,
      numSignatures: this.signature.length,
      instructionsData: this._instructionsData,
    };
  }

  /** Serialize for broadcast (base64) */
  toBroadcastFormat(): string {
    if (!this._wasmTransaction) {
      throw new InvalidTransactionError('Transaction not initialized');
    }
    return Buffer.from(this._wasmTransaction.toBytes()).toString('base64');
  }

  // =============================================================================
  // Explanation
  // =============================================================================

  /**
   * Explain the transaction for human readability.
   */
  explainTransaction(): TransactionExplanation {
    if (!this._parsedTransaction) {
      throw new InvalidTransactionError('Transaction not initialized');
    }

    const displayOrder = [
      'id',
      'type',
      'blockhash',
      'durableNonce',
      'outputAmount',
      'changeAmount',
      'outputs',
      'changeOutputs',
      'tokenEnablements',
      'fee',
      'memo',
    ];

    const outputs: { address: string; amount: string; memo?: string; tokenName?: string }[] = [];
    const tokenEnablements: { address: string; tokenName: string; tokenAddress: string }[] = [];
    let outputAmount = '0';
    let memo: string | undefined;

    for (const instr of this._instructionsData) {
      switch (instr.type) {
        case InstructionBuilderTypes.Transfer:
          outputs.push({
            address: instr.params.toAddress,
            amount: instr.params.amount,
          });
          outputAmount = (BigInt(outputAmount) + BigInt(instr.params.amount)).toString();
          break;
        case InstructionBuilderTypes.TokenTransfer:
          // Token transfers don't contribute to outputAmount (only SOL transfers do)
          outputs.push({
            address: instr.params.toAddress,
            amount: instr.params.amount,
            tokenName: instr.params.tokenName,
          });
          break;
        case InstructionBuilderTypes.StakingActivate:
          outputs.push({
            address: instr.params.stakingAddress,
            amount: instr.params.amount,
          });
          outputAmount = (BigInt(outputAmount) + BigInt(instr.params.amount)).toString();
          break;
        case InstructionBuilderTypes.StakingWithdraw:
          outputs.push({
            address: instr.params.fromAddress,
            amount: instr.params.amount,
          });
          outputAmount = (BigInt(outputAmount) + BigInt(instr.params.amount)).toString();
          break;
        case InstructionBuilderTypes.CreateNonceAccount:
          // WalletInit / Nonce account creation
          outputs.push({
            address: instr.params.nonceAddress,
            amount: instr.params.amount,
          });
          outputAmount = (BigInt(outputAmount) + BigInt(instr.params.amount)).toString();
          break;
        case InstructionBuilderTypes.Memo:
          memo = instr.params.memo;
          break;
        case InstructionBuilderTypes.CreateAssociatedTokenAccount:
          // Process token enablement instructions and collect them in the tokenEnablements array
          tokenEnablements.push({
            address: instr.params.ataAddress,
            tokenName: instr.params.tokenName,
            tokenAddress: instr.params.mintAddress,
          });
          break;
      }
    }

    // Detect durable nonce for explanation
    let durableNonce: DurableNonceParams | undefined;
    if (this._parsedTransaction.durableNonce) {
      durableNonce = this._parsedTransaction.durableNonce;
    }

    // Calculate fee: lamportsPerSignature * numberOfRequiredSignatures + rentFees (same as legacy Transaction)
    // The rent fees are: tokenAccountRentExemptAmount * numberOfATACreationInstructions
    const numSignatures = this._parsedTransaction.numSignatures;
    const numberOfATACreationInstructions = this._instructionsData.filter(
      (i) => i.type === InstructionBuilderTypes.CreateAssociatedTokenAccount
    ).length;
    const signatureFees =
      this._lamportsPerSignature !== undefined ? BigInt(this._lamportsPerSignature) * BigInt(numSignatures) : BigInt(0);
    const rentFees =
      this._tokenAccountRentExemptAmount !== undefined
        ? BigInt(this._tokenAccountRentExemptAmount) * BigInt(numberOfATACreationInstructions)
        : BigInt(0);
    const feeAmount =
      this._lamportsPerSignature !== undefined || this._tokenAccountRentExemptAmount !== undefined
        ? (signatureFees + rentFees).toString()
        : UNAVAILABLE_TEXT;

    return {
      displayOrder,
      id: this.id,
      type: TransactionType[this._type]?.toString() || 'Unknown',
      blockhash: this._parsedTransaction.nonce,
      durableNonce,
      outputs,
      outputAmount,
      changeOutputs: [],
      changeAmount: '0',
      fee: {
        fee: feeAmount,
        feeRate: this._lamportsPerSignature,
      },
      memo,
      tokenEnablements,
    };
  }

  // =============================================================================
  // Internal Helpers
  // =============================================================================

  /**
   * Populate inputs and outputs from instruction data.
   */
  private loadInputsAndOutputs(): void {
    const outputs: Entry[] = [];
    const inputs: Entry[] = [];

    for (const instruction of this._instructionsData) {
      switch (instruction.type) {
        case InstructionBuilderTypes.CreateNonceAccount:
          inputs.push({
            address: instruction.params.fromAddress,
            value: instruction.params.amount,
            coin: this._coinConfig.name,
          });
          break;

        case InstructionBuilderTypes.Transfer:
          inputs.push({
            address: instruction.params.fromAddress,
            value: instruction.params.amount,
            coin: this._coinConfig.name,
          });
          outputs.push({
            address: instruction.params.toAddress,
            value: instruction.params.amount,
            coin: this._coinConfig.name,
          });
          break;

        case InstructionBuilderTypes.TokenTransfer:
          inputs.push({
            address: instruction.params.fromAddress,
            value: instruction.params.amount,
            coin: instruction.params.tokenName,
          });
          outputs.push({
            address: instruction.params.toAddress,
            value: instruction.params.amount,
            coin: instruction.params.tokenName,
          });
          break;

        case InstructionBuilderTypes.StakingActivate:
          inputs.push({
            address: instruction.params.fromAddress,
            value: instruction.params.amount,
            coin: this._coinConfig.name,
          });
          if (instruction.params.stakingType !== SolStakingTypeEnum.JITO) {
            outputs.push({
              address: instruction.params.stakingAddress,
              value: instruction.params.amount,
              coin: this._coinConfig.name,
            });
          }
          break;

        case InstructionBuilderTypes.StakingDeactivate:
          if (
            instruction.params.amount &&
            instruction.params.unstakingAddress &&
            instruction.params.stakingType !== SolStakingTypeEnum.JITO
          ) {
            inputs.push({
              address: instruction.params.stakingAddress,
              value: instruction.params.amount,
              coin: this._coinConfig.name,
            });
            outputs.push({
              address: instruction.params.unstakingAddress,
              value: instruction.params.amount,
              coin: this._coinConfig.name,
            });
          }
          break;

        case InstructionBuilderTypes.StakingWithdraw:
          inputs.push({
            address: instruction.params.stakingAddress,
            value: instruction.params.amount,
            coin: this._coinConfig.name,
          });
          outputs.push({
            address: instruction.params.fromAddress,
            value: instruction.params.amount,
            coin: this._coinConfig.name,
          });
          break;

        // These don't affect inputs/outputs
        case InstructionBuilderTypes.CreateAssociatedTokenAccount:
        case InstructionBuilderTypes.CloseAssociatedTokenAccount:
        case InstructionBuilderTypes.StakingAuthorize:
        case InstructionBuilderTypes.StakingDelegate:
        case InstructionBuilderTypes.SetComputeUnitLimit:
        case InstructionBuilderTypes.SetPriorityFee:
        case InstructionBuilderTypes.CustomInstruction:
        case InstructionBuilderTypes.Memo:
        case InstructionBuilderTypes.NonceAdvance:
          break;
      }
    }

    this._outputs = outputs;
    this._inputs = inputs;
  }
}
