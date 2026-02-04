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
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  parseTransaction,
  Transaction as WasmSolanaTransaction,
  ParsedTransaction as WasmParsedTransaction,
} from '@bitgo/wasm-solana';
import base58 from 'bs58';
import { SolStakingTypeEnum } from '@bitgo/public-types';
import { combineWasmInstructionsFromBytes } from '../wasmInstructionCombiner';
import { InstructionBuilderTypes, UNAVAILABLE_TEXT } from '../constants';
import { DurableNonceParams, InstructionParams, TxData, TransactionExplanation } from '../iface';

/**
 * Solana transaction using WASM for all parsing operations.
 *
 * Key differences from legacy Transaction:
 * - No @solana/web3.js dependency
 * - No conditional code paths
 * - ~150 lines instead of 800+
 */
export class WasmTransaction extends BaseTransaction {
  private _wasmTransaction: WasmSolanaTransaction | undefined;
  private _parsedTransaction: WasmParsedTransaction | undefined;
  private _rawTransaction: string | undefined;
  private _lamportsPerSignature: number | undefined;
  private _tokenAccountRentExemptAmount: string | undefined;
  protected _type: TransactionType;
  protected _instructionsData: InstructionParams[] = [];

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  // =============================================================================
  // Core Properties
  // =============================================================================

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
  // Signing
  // =============================================================================

  /**
   * Check if a key can sign this transaction.
   * Matches legacy Transaction behavior - always returns true.
   */
  canSign(): boolean {
    return true;
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
      'fee',
      'memo',
    ];

    const outputs: { address: string; amount: string; memo?: string }[] = [];
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
          outputs.push({
            address: instr.params.toAddress,
            amount: instr.params.amount,
          });
          outputAmount = (BigInt(outputAmount) + BigInt(instr.params.amount)).toString();
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
        case InstructionBuilderTypes.Memo:
          memo = instr.params.memo;
          break;
      }
    }

    // Detect durable nonce for explanation
    let durableNonce: DurableNonceParams | undefined;
    if (this._parsedTransaction.durableNonce) {
      durableNonce = this._parsedTransaction.durableNonce;
    }

    return {
      displayOrder,
      id: this.id !== UNAVAILABLE_TEXT ? this.id : 'UNSIGNED',
      type: this.type?.toString() || 'Unknown',
      blockhash: this._parsedTransaction.nonce,
      durableNonce,
      outputs,
      outputAmount,
      changeOutputs: [],
      changeAmount: '0',
      fee: { fee: this._lamportsPerSignature?.toString() || 'UNKNOWN' },
      memo,
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
