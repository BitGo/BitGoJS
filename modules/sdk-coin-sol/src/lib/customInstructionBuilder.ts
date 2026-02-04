import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  BaseTransaction,
  BuildTransactionError,
  SolInstruction,
  SolVersionedInstruction,
  TransactionType,
} from '@bitgo/sdk-core';
import { PublicKey, SystemProgram, SYSVAR_RECENT_BLOCKHASHES_PUBKEY } from '@solana/web3.js';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { InstructionBuilderTypes } from './constants';
import { CustomInstruction, VersionedCustomInstruction, VersionedTransactionData } from './iface';
import { isSolLegacyInstruction } from './utils';
import { WasmTransaction } from './wasm';
import assert from 'assert';

/**
 * Transaction builder for custom Solana instructions.
 * Allows building transactions with any set of raw Solana instructions.
 */
export class CustomInstructionBuilder extends TransactionBuilder {
  private _customInstructions: (CustomInstruction | VersionedCustomInstruction)[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.CustomTx;
  }

  /**
   * Initialize the builder from an existing transaction
   */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.initFromInstructionsData();
  }

  /** @inheritDoc */
  initBuilderFromWasm(wasmTx: WasmTransaction): void {
    super.initBuilderFromWasm(wasmTx);
    this.initFromInstructionsData();
  }

  /**
   * Extract custom instruction parameters from instructionsData.
   * Called by both initBuilder and initBuilderFromWasm.
   */
  private initFromInstructionsData(): void {
    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.CustomInstruction) {
        const customInstruction = instruction as CustomInstruction;
        this.addCustomInstruction(customInstruction.params);
      } else if (instruction.type === InstructionBuilderTypes.VersionedCustomInstruction) {
        const versionedCustomInstruction = instruction as VersionedCustomInstruction;
        this.addCustomInstruction(versionedCustomInstruction.params);
      }
    }
  }

  /**
   * Add a custom instruction to the transaction
   * @param instruction - The custom instruction to add
   * @returns This builder instance
   */
  addCustomInstruction(instruction: SolInstruction | SolVersionedInstruction): this {
    this.validateInstruction(instruction);

    if (isSolLegacyInstruction(instruction)) {
      const customInstruction: CustomInstruction = {
        type: InstructionBuilderTypes.CustomInstruction,
        params: instruction,
      };
      this._customInstructions.push(customInstruction);
    } else {
      const versionedCustomInstruction: VersionedCustomInstruction = {
        type: InstructionBuilderTypes.VersionedCustomInstruction,
        params: instruction,
      };
      this._customInstructions.push(versionedCustomInstruction);
    }

    return this;
  }

  /**
   * Add multiple custom instructions to the transaction
   * @param instructions - Array of custom instructions to add
   * @returns This builder instance
   */
  addCustomInstructions(instructions: (SolInstruction | SolVersionedInstruction)[]): this {
    if (!Array.isArray(instructions)) {
      throw new BuildTransactionError('Instructions must be an array');
    }
    for (const instruction of instructions) {
      this.addCustomInstruction(instruction);
    }
    return this;
  }

  /**
   * Build transaction from deconstructed VersionedTransaction data
   * @param data - VersionedTransactionData containing instructions, ALTs, and account keys
   * @returns This builder instance
   */
  fromVersionedTransactionData(data: VersionedTransactionData): this {
    try {
      if (!data || typeof data !== 'object') {
        throw new BuildTransactionError('VersionedTransactionData must be a valid object');
      }

      if (!Array.isArray(data.versionedInstructions) || data.versionedInstructions.length === 0) {
        throw new BuildTransactionError('versionedInstructions must be a non-empty array');
      }

      if (!Array.isArray(data.addressLookupTables)) {
        throw new BuildTransactionError('addressLookupTables must be an array');
      }

      if (!Array.isArray(data.staticAccountKeys) || data.staticAccountKeys.length === 0) {
        throw new BuildTransactionError('staticAccountKeys must be a non-empty array');
      }

      if (!data.messageHeader || typeof data.messageHeader !== 'object') {
        throw new BuildTransactionError('messageHeader must be a valid object');
      }
      if (
        typeof data.messageHeader.numRequiredSignatures !== 'number' ||
        data.messageHeader.numRequiredSignatures < 0
      ) {
        throw new BuildTransactionError('messageHeader.numRequiredSignatures must be a non-negative number');
      }
      if (
        typeof data.messageHeader.numReadonlySignedAccounts !== 'number' ||
        data.messageHeader.numReadonlySignedAccounts < 0
      ) {
        throw new BuildTransactionError('messageHeader.numReadonlySignedAccounts must be a non-negative number');
      }
      if (
        typeof data.messageHeader.numReadonlyUnsignedAccounts !== 'number' ||
        data.messageHeader.numReadonlyUnsignedAccounts < 0
      ) {
        throw new BuildTransactionError('messageHeader.numReadonlyUnsignedAccounts must be a non-negative number');
      }

      const isTestnet = this._coinConfig.name === 'tsol';

      if (isTestnet) {
        // Testnet: store on builder for WASM path, nonce injection in wasm/builder.ts
        this._versionedTransactionData = data;
        this.addCustomInstructions(data.versionedInstructions);
      } else {
        // Mainnet: original behavior unchanged - store on Transaction, inject nonce here
        let processedData = data;
        if (this._nonceInfo && this._nonceInfo.params) {
          processedData = this.injectNonceAdvanceInstruction(data);
        }
        this.addCustomInstructions(processedData.versionedInstructions);
        if (!this._transaction) {
          this._transaction = new Transaction(this._coinConfig);
        }
        this._transaction.setVersionedTransactionData(processedData);
        this._transaction.setTransactionType(TransactionType.CustomTx);
      }

      if (!this._sender && data.staticAccountKeys.length > 0) {
        this._sender = data.staticAccountKeys[0];
      }

      return this;
    } catch (error) {
      if (error instanceof BuildTransactionError) {
        throw error;
      }
      throw new BuildTransactionError(`Failed to process versioned transaction data: ${error.message}`);
    }
  }

  /**
   * Inject nonce advance instruction into versioned transaction data.
   * Used by mainnet legacy path for durable nonce support.
   */
  private injectNonceAdvanceInstruction(data: VersionedTransactionData): VersionedTransactionData {
    const { walletNonceAddress, authWalletAddress } = this._nonceInfo!.params;
    const SYSTEM_PROGRAM = SystemProgram.programId.toBase58();
    const SYSVAR_RECENT_BLOCKHASHES = SYSVAR_RECENT_BLOCKHASHES_PUBKEY.toBase58();

    const numSigners = data.messageHeader.numRequiredSignatures;
    const originalSigners = data.staticAccountKeys.slice(0, numSigners);
    const originalNonSigners = data.staticAccountKeys.slice(numSigners);

    if (!originalSigners.includes(authWalletAddress)) {
      originalSigners.push(authWalletAddress);
    }

    const nonSigners = [...originalNonSigners];
    const allKeys = [...originalSigners, ...originalNonSigners];

    if (!allKeys.includes(SYSTEM_PROGRAM)) nonSigners.push(SYSTEM_PROGRAM);
    if (!allKeys.includes(walletNonceAddress)) nonSigners.push(walletNonceAddress);
    if (!allKeys.includes(SYSVAR_RECENT_BLOCKHASHES)) nonSigners.push(SYSVAR_RECENT_BLOCKHASHES);

    const newStaticAccountKeys = [...originalSigners, ...nonSigners];

    const nonceAdvanceInstruction: SolVersionedInstruction = {
      programIdIndex: newStaticAccountKeys.indexOf(SYSTEM_PROGRAM),
      accountKeyIndexes: [
        newStaticAccountKeys.indexOf(walletNonceAddress),
        newStaticAccountKeys.indexOf(SYSVAR_RECENT_BLOCKHASHES),
        newStaticAccountKeys.indexOf(authWalletAddress),
      ],
      data: '6vx8P', // SystemProgram AdvanceNonceAccount (0x04000000) in base58
    };

    const indexMap = new Map(data.staticAccountKeys.map((key, oldIdx) => [oldIdx, newStaticAccountKeys.indexOf(key)]));
    const remappedInstructions = data.versionedInstructions.map((inst) => ({
      programIdIndex: indexMap.get(inst.programIdIndex) ?? inst.programIdIndex,
      accountKeyIndexes: inst.accountKeyIndexes.map((idx) => indexMap.get(idx) ?? idx),
      data: inst.data,
    }));

    return {
      ...data,
      versionedInstructions: [nonceAdvanceInstruction, ...remappedInstructions],
      staticAccountKeys: newStaticAccountKeys,
      messageHeader: {
        ...data.messageHeader,
        numRequiredSignatures: originalSigners.length,
      },
    };
  }

  /**
   * Clear all custom instructions and versioned transaction data
   * @returns This builder instance
   */
  clearInstructions(): this {
    this._customInstructions = [];
    if (this._transaction) {
      this._transaction.setVersionedTransactionData(undefined);
    }
    return this;
  }

  /**
   * Get the current custom instructions
   * @returns Array of custom instructions
   */
  getInstructions(): (CustomInstruction | VersionedCustomInstruction)[] {
    return [...this._customInstructions];
  }

  /**
   * Validate custom instruction format
   * @param instruction - The instruction to validate
   */
  private validateInstruction(instruction: SolInstruction | SolVersionedInstruction): void {
    if (!instruction) {
      throw new BuildTransactionError('Instruction cannot be null or undefined');
    }

    if (isSolLegacyInstruction(instruction)) {
      this.validateSolInstruction(instruction);
    } else {
      this.validateVersionedInstruction(instruction);
    }
  }

  /**
   * Validate traditional SolInstruction format
   * @param instruction - The traditional instruction to validate
   */
  private validateSolInstruction(instruction: SolInstruction): void {
    if (!instruction.programId || typeof instruction.programId !== 'string') {
      throw new BuildTransactionError('Instruction must have a valid programId string');
    }

    // Validate that programId is a valid Solana public key
    try {
      new PublicKey(instruction.programId);
    } catch (error) {
      throw new BuildTransactionError('Invalid programId format');
    }

    if (!instruction.keys || !Array.isArray(instruction.keys)) {
      throw new BuildTransactionError('Instruction must have valid keys array');
    }

    // Validate each key
    for (const key of instruction.keys) {
      if (!key.pubkey || typeof key.pubkey !== 'string') {
        throw new BuildTransactionError('Each key must have a valid pubkey string');
      }

      try {
        new PublicKey(key.pubkey);
      } catch (error) {
        throw new BuildTransactionError('Invalid pubkey format in keys');
      }

      if (typeof key.isSigner !== 'boolean') {
        throw new BuildTransactionError('Each key must have a boolean isSigner field');
      }

      if (typeof key.isWritable !== 'boolean') {
        throw new BuildTransactionError('Each key must have a boolean isWritable field');
      }
    }

    if (instruction.data === undefined || typeof instruction.data !== 'string') {
      throw new BuildTransactionError('Instruction must have valid data string');
    }
  }

  /**
   * Validate versioned instruction format
   * @param instruction - The versioned instruction to validate
   */
  private validateVersionedInstruction(instruction: SolVersionedInstruction): void {
    if (typeof instruction.programIdIndex !== 'number' || instruction.programIdIndex < 0) {
      throw new BuildTransactionError('Versioned instruction must have a valid programIdIndex number');
    }

    if (!instruction.accountKeyIndexes || !Array.isArray(instruction.accountKeyIndexes)) {
      throw new BuildTransactionError('Versioned instruction must have valid accountKeyIndexes array');
    }

    // Validate each account key index
    for (const index of instruction.accountKeyIndexes) {
      if (typeof index !== 'number' || index < 0) {
        throw new BuildTransactionError('Each accountKeyIndex must be a non-negative number');
      }
    }

    if (instruction.data === undefined || typeof instruction.data !== 'string') {
      throw new BuildTransactionError('Versioned instruction must have valid data string');
    }
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<BaseTransaction> {
    assert(this._customInstructions.length > 0, 'At least one custom instruction must be specified');

    // Set the instructions data to our custom instructions
    this._instructionsData = [...this._customInstructions];

    return await super.buildImplementation();
  }
}
