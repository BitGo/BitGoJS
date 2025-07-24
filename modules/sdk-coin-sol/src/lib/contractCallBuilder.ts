import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { InstructionBuilderTypes } from './constants';
import { ContractCall, InstructionParams } from './iface';

import assert from 'assert';
import { PublicKey } from '@solana/web3.js';

export interface ContractCallParams {
  programId: string;
  instructions: InstructionParams[];
}

export class ContractCallBuilder extends TransactionBuilder {
  private _programId: string;
  private _instructions: InstructionParams[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.ContractCall;
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);

    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.ContractCall) {
        const contractInstruction: ContractCall = instruction;
        this.programId(contractInstruction.params.programId);
        this.instructions(contractInstruction.params.instructions);
      }
    }
  }

  /**
   * Set the program ID for the contract call
   *
   * @param {string} programId - The program ID (address) of the smart contract
   * @returns {ContractCallBuilder} This contract call builder
   */
  programId(programId: string): this {
    try {
      new PublicKey(programId);
    } catch (error) {
      throw new BuildTransactionError(`Invalid program ID: ${programId}`);
    }
    this._programId = programId;
    return this;
  }

  /**
   * Set the instructions for the contract call
   *
   * @param {InstructionParams[]} instructions - Array of instruction parameters
   * @returns {ContractCallBuilder} This contract call builder
   */
  instructions(instructions: InstructionParams[]): this {
    if (!Array.isArray(instructions)) {
      throw new BuildTransactionError('Instructions must be an array');
    }
    this._instructions = [...instructions];
    return this;
  }

  /**
   * Add a single instruction to the contract call
   *
   * @param {InstructionParams} instruction - Single instruction parameter
   * @returns {ContractCallBuilder} This contract call builder
   */
  addInstruction(instruction: InstructionParams): this {
    if (!instruction || typeof instruction !== 'object') {
      throw new BuildTransactionError('Invalid instruction parameter');
    }
    this._instructions.push(instruction);
    return this;
  }

  /**
   * Clear all instructions
   *
   * @returns {ContractCallBuilder} This contract call builder
   */
  clearInstructions(): this {
    this._instructions = [];
    return this;
  }

  /**
   * Get the current instructions
   *
   * @returns {InstructionParams[]} Array of current instructions
   */
  getInstructions(): InstructionParams[] {
    return [...this._instructions];
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._sender, 'Sender must be set before building the transaction');
    assert(this._programId, 'Program ID must be set before building the transaction');

    if (!this._instructions.length) {
      throw new BuildTransactionError('At least one instruction must be provided');
    }

    const contractCallData: ContractCall = {
      type: InstructionBuilderTypes.ContractCall,
      params: {
        programId: this._programId,
        instructions: this._instructions,
      },
    };

    this._instructionsData = [contractCallData];

    return await super.buildImplementation();
  }
}
