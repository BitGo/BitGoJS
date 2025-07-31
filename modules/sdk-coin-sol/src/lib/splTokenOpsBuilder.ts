import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { getSolTokenFromTokenName, isValidAmount, validateAddress, validateMintAddress } from './utils';
import { InstructionBuilderTypes } from './constants';
import { MintTo, Burn, SetPriorityFee, SplTokenOperation } from './iface';
import assert from 'assert';
import { TransactionBuilder } from './transactionBuilder';

/**
 * Valid SPL token operation types
 */
const VALID_OPERATION_TYPES = ['mint', 'burn'] as const;

/**
 * Transaction builder for SPL token mint and burn operations.
 * Supports mixed operations in a single transaction.
 */
export class SplTokenOpsBuilder extends TransactionBuilder {
  private _operations: SplTokenOperation[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  /**
   * Add a mint operation to the transaction
   *
   * @param operation - The mint operation parameters
   * @returns This transaction builder
   */
  mint(operation: Omit<SplTokenOperation, 'type'>): this {
    this.addOperation({ ...operation, type: 'mint' });
    return this;
  }

  /**
   * Add a burn operation to the transaction
   *
   * @param operation - The burn operation parameters
   * @returns This transaction builder
   */
  burn(operation: Omit<SplTokenOperation, 'type'>): this {
    this.addOperation({ ...operation, type: 'burn' });
    return this;
  }

  /**
   * Add a generic SPL token operation (mint or burn)
   *
   * @param operation - The operation parameters
   * @returns This transaction builder
   */
  addOperation(operation: SplTokenOperation): this {
    this.validateOperation(operation);
    this._operations.push(operation);
    return this;
  }

  /**
   * Validates an SPL token operation
   * @param operation - The operation to validate
   */
  private validateOperation(operation: SplTokenOperation): void {
    this.validateOperationType(operation.type);
    this.validateCommonFields(operation);
    this.validateOperationSpecificFields(operation);
    this.validateTokenInformation(operation);
  }

  /**
   * Validates the operation type
   */
  private validateOperationType(type: string): void {
    if (!type || !(VALID_OPERATION_TYPES as readonly string[]).includes(type)) {
      throw new BuildTransactionError(`Operation type must be one of: ${VALID_OPERATION_TYPES.join(', ')}`);
    }
  }

  /**
   * Validates fields common to all operations
   */
  private validateCommonFields(operation: SplTokenOperation): void {
    if (!operation.amount || !isValidAmount(operation.amount)) {
      throw new BuildTransactionError('Invalid amount: ' + operation.amount);
    }

    if (!operation.authorityAddress) {
      throw new BuildTransactionError('Operation requires authorityAddress');
    }
    validateAddress(operation.authorityAddress, 'authorityAddress');
  }

  /**
   * Validates operation-specific fields based on type
   */
  private validateOperationSpecificFields(operation: SplTokenOperation): void {
    switch (operation.type) {
      case 'mint':
        this.validateMintOperation(operation);
        break;
      case 'burn':
        this.validateBurnOperation(operation);
        break;
      default:
        throw new BuildTransactionError(`Unsupported operation type: ${operation.type}`);
    }
  }

  /**
   * Validates mint-specific fields
   */
  private validateMintOperation(operation: SplTokenOperation): void {
    if (!operation.destinationAddress) {
      throw new BuildTransactionError('Mint operation requires destinationAddress');
    }
    validateAddress(operation.destinationAddress, 'destinationAddress');
  }

  /**
   * Validates burn-specific fields
   */
  private validateBurnOperation(operation: SplTokenOperation): void {
    if (!operation.accountAddress) {
      throw new BuildTransactionError('Burn operation requires accountAddress');
    }
    validateAddress(operation.accountAddress, 'accountAddress');
  }

  /**
   * Validates token information (name or mint address)
   */
  private validateTokenInformation(operation: SplTokenOperation): void {
    if (!operation.tokenName && !operation.mintAddress) {
      throw new BuildTransactionError('Either tokenName or mintAddress must be provided');
    }

    if (operation.tokenName) {
      const token = getSolTokenFromTokenName(operation.tokenName);
      if (!token && !operation.mintAddress) {
        throw new BuildTransactionError('Invalid token name or missing mintAddress: ' + operation.tokenName);
      }
    }

    if (operation.mintAddress) {
      validateMintAddress(operation.mintAddress);
    }
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);

    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.MintTo) {
        const mintInstruction: MintTo = instruction;
        this.addOperation({
          type: 'mint',
          mintAddress: mintInstruction.params.mintAddress,
          destinationAddress: mintInstruction.params.destinationAddress,
          authorityAddress: mintInstruction.params.authorityAddress,
          amount: mintInstruction.params.amount,
          tokenName: mintInstruction.params.tokenName,
          programId: mintInstruction.params.programId,
        });
      } else if (instruction.type === InstructionBuilderTypes.Burn) {
        const burnInstruction: Burn = instruction;
        this.addOperation({
          type: 'burn',
          mintAddress: burnInstruction.params.mintAddress,
          accountAddress: burnInstruction.params.accountAddress,
          authorityAddress: burnInstruction.params.authorityAddress,
          amount: burnInstruction.params.amount,
          tokenName: burnInstruction.params.tokenName,
          programId: burnInstruction.params.programId,
        });
      }
    }
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._operations.length > 0, 'At least one SPL token operation must be specified');

    const instructions = this._operations.map((operation) => this.createInstructionFromOperation(operation));

    // Add priority fee instruction if needed
    if (this._priorityFee && this._priorityFee > 0) {
      const priorityFeeInstruction: SetPriorityFee = {
        type: InstructionBuilderTypes.SetPriorityFee,
        params: { fee: this._priorityFee },
      };
      this._instructionsData = [priorityFeeInstruction, ...instructions];
    } else {
      this._instructionsData = instructions;
    }

    return await super.buildImplementation();
  }

  /**
   * Creates an instruction from an operation
   */
  private createInstructionFromOperation(operation: SplTokenOperation): MintTo | Burn {
    const tokenInfo = this.resolveTokenInfo(operation);

    switch (operation.type) {
      case 'mint':
        return this.createMintInstruction(operation, tokenInfo);
      case 'burn':
        return this.createBurnInstruction(operation, tokenInfo);
      default:
        throw new BuildTransactionError(`Unsupported operation type: ${operation.type}`);
    }
  }

  /**
   * Resolves token information from operation
   */
  private resolveTokenInfo(operation: SplTokenOperation): {
    mintAddress: string;
    tokenName: string;
    programId?: string;
  } {
    if (operation.mintAddress) {
      return {
        mintAddress: operation.mintAddress,
        tokenName: operation.tokenName || operation.mintAddress,
        programId: operation.programId,
      };
    } else if (operation.tokenName) {
      const token = getSolTokenFromTokenName(operation.tokenName);
      if (token) {
        return {
          mintAddress: token.tokenAddress,
          tokenName: token.name,
          programId: token.programId,
        };
      } else {
        throw new BuildTransactionError('Invalid token name: ' + operation.tokenName);
      }
    } else {
      throw new BuildTransactionError('Either tokenName or mintAddress must be provided');
    }
  }

  /**
   * Creates a mint instruction
   */
  private createMintInstruction(
    operation: SplTokenOperation,
    tokenInfo: { mintAddress: string; tokenName: string; programId?: string }
  ): MintTo {
    if (!operation.destinationAddress) {
      throw new BuildTransactionError('Mint operation requires destinationAddress');
    }

    const params = {
      mintAddress: tokenInfo.mintAddress,
      destinationAddress: operation.destinationAddress,
      authorityAddress: operation.authorityAddress,
      amount: operation.amount,
      tokenName: tokenInfo.tokenName,
      programId: tokenInfo.programId,
      ...(operation.decimalPlaces !== undefined && { decimalPlaces: operation.decimalPlaces }),
    };

    return {
      type: InstructionBuilderTypes.MintTo,
      params,
    };
  }

  /**
   * Creates a burn instruction
   */
  private createBurnInstruction(
    operation: SplTokenOperation,
    tokenInfo: { mintAddress: string; tokenName: string; programId?: string }
  ): Burn {
    if (!operation.accountAddress) {
      throw new BuildTransactionError('Burn operation requires accountAddress');
    }
    return {
      type: InstructionBuilderTypes.Burn,
      params: {
        mintAddress: tokenInfo.mintAddress,
        accountAddress: operation.accountAddress,
        authorityAddress: operation.authorityAddress,
        amount: operation.amount,
        tokenName: tokenInfo.tokenName,
        programId: tokenInfo.programId,
        decimalPlaces: operation.decimalPlaces,
      },
    };
  }
}
