import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransactionInstruction } from '@solana/web3.js';
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
    return TransactionType.Send;
  }

  /**
   * Initialize the builder from an existing transaction
   */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);

    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.CustomInstruction) {
        const customInstruction = instruction as CustomInstruction;
        this.addCustomInstruction(customInstruction.params.instruction);
      }
    }
  }

  /**
   * Add a custom Solana instruction to the transaction
   *
   * @param instruction - The raw Solana TransactionInstruction
   * @returns This transaction builder
   */
  addCustomInstruction(instruction: TransactionInstruction): this {
    if (!instruction) {
      throw new BuildTransactionError('Instruction cannot be null or undefined');
    }

    if (!instruction.programId) {
      throw new BuildTransactionError('Instruction must have a valid programId');
    }

    if (!instruction.keys || !Array.isArray(instruction.keys)) {
      throw new BuildTransactionError('Instruction must have valid keys array');
    }

    if (!instruction.data || !Buffer.isBuffer(instruction.data)) {
      throw new BuildTransactionError('Instruction must have valid data buffer');
    }

    const customInstruction: CustomInstruction = {
      type: InstructionBuilderTypes.CustomInstruction,
      params: {
        instruction,
      },
    };

    this._customInstructions.push(customInstruction);
    return this;
  }

  /**
   * Add multiple custom Solana instructions to the transaction
   *
   * @param instructions - Array of raw Solana TransactionInstructions
   * @returns This transaction builder
   */
  addCustomInstructions(instructions: TransactionInstruction[]): this {
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
   *
   * @returns This transaction builder
   */
  clearInstructions(): this {
    this._customInstructions = [];
    return this;
  }

  /**
   * Get the current custom instructions
   *
   * @returns Array of custom instructions
   */
  getInstructions(): CustomInstruction[] {
    return [...this._customInstructions];
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._customInstructions.length > 0, 'At least one custom instruction must be specified');

    // Set the instructions data to our custom instructions
    this._instructionsData = [...this._customInstructions];

    return await super.buildImplementation();
  }
}
