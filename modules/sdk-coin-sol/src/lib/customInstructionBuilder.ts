import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import { BuildTransactionError, SolInstruction, TransactionType } from '@bitgo-beta/sdk-core';
import { PublicKey } from '@solana/web3.js';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { InstructionBuilderTypes } from './constants';
import { CustomInstruction } from './iface';
import assert from 'assert';

/**
 * Transaction builder for custom Solana instructions.
 * Allows building transactions with any set of raw Solana instructions.
 */
export class CustomInstructionBuilder extends TransactionBuilder {
  private _customInstructions: CustomInstruction[] = [];

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

    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.CustomInstruction) {
        const customInstruction = instruction as CustomInstruction;
        this.addCustomInstruction(customInstruction.params);
      }
    }
  }

  /**
   * Add a custom instruction to the transaction
   * @param instruction - The custom instruction to add
   * @returns This builder instance
   */
  addCustomInstruction(instruction: SolInstruction): this {
    this.validateInstruction(instruction);
    const customInstruction: CustomInstruction = {
      type: InstructionBuilderTypes.CustomInstruction,
      params: instruction,
    };
    this._customInstructions.push(customInstruction);
    return this;
  }

  /**
   * Add multiple custom instructions to the transaction
   * @param instructions - Array of custom instructions to add
   * @returns This builder instance
   */
  addCustomInstructions(instructions: SolInstruction[]): this {
    if (!Array.isArray(instructions)) {
      throw new BuildTransactionError('Instructions must be an array');
    }
    for (const instruction of instructions) {
      this.addCustomInstruction(instruction);
    }
    return this;
  }

  /**
   * Clear all custom instructions
   * @returns This builder instance
   */
  clearInstructions(): this {
    this._customInstructions = [];
    return this;
  }

  /**
   * Get the current custom instructions
   * @returns Array of custom instructions
   */
  getInstructions(): CustomInstruction[] {
    return [...this._customInstructions];
  }

  /**
   * Validate custom instruction format
   * @param instruction - The instruction to validate
   */
  private validateInstruction(instruction: SolInstruction): void {
    if (!instruction) {
      throw new BuildTransactionError('Instruction cannot be null or undefined');
    }

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

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._customInstructions.length > 0, 'At least one custom instruction must be specified');

    // Set the instructions data to our custom instructions
    this._instructionsData = [...this._customInstructions];

    return await super.buildImplementation();
  }
}
