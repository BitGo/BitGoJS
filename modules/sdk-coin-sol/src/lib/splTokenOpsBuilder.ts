import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { getSolTokenFromTokenName, isValidAmount, validateAddress, validateMintAddress } from './utils';
import { InstructionBuilderTypes } from './constants';
import { MintTo, Burn, SetPriorityFee, MintToParams, BurnParams } from './iface';
import assert from 'assert';
import { TransactionBuilder } from './transactionBuilder';

/**
 * Transaction builder for SPL token mint and burn operations.
 * Supports mixed operations in a single transaction.
 */
export class SplTokenOpsBuilder extends TransactionBuilder {
  private _operations: (MintTo | Burn)[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  /**
   * Add a mint operation to the transaction
   *
   * @param params - The mint operation parameters
   * @returns This transaction builder
   */
  mint(params: MintToParams): this {
    const operation: MintTo = {
      type: InstructionBuilderTypes.MintTo,
      params,
    };
    this.addOperation(operation);
    return this;
  }

  /**
   * Add a burn operation to the transaction
   *
   * @param params - The burn operation parameters
   * @returns This transaction builder
   */
  burn(params: BurnParams): this {
    const operation: Burn = {
      type: InstructionBuilderTypes.Burn,
      params,
    };
    this.addOperation(operation);
    return this;
  }

  /**
   * Add a generic SPL token operation (mint or burn)
   *
   * @param operation - The operation parameters
   * @returns This transaction builder
   */
  addOperation(operation: MintTo | Burn): this {
    this.validateOperation(operation);
    this._operations.push(operation);
    return this;
  }

  /**
   * Validates an SPL token operation
   * @param operation - The operation to validate
   */
  private validateOperation(operation: MintTo | Burn): void {
    this.validateOperationType(operation.type);
    this.validateCommonFields(operation);
    this.validateOperationSpecificFields(operation);
    this.validateTokenInformation(operation);
  }

  /**
   * Validates the operation type
   */
  private validateOperationType(type: InstructionBuilderTypes): void {
    const validTypes = [InstructionBuilderTypes.MintTo, InstructionBuilderTypes.Burn];
    if (!type || !validTypes.includes(type)) {
      throw new BuildTransactionError(`Operation type must be one of: ${validTypes.join(', ')}`);
    }
  }

  /**
   * Validates fields common to all operations
   */
  private validateCommonFields(operation: MintTo | Burn): void {
    const params = operation.params;
    if (!params.amount || !isValidAmount(params.amount)) {
      throw new BuildTransactionError('Invalid amount: ' + params.amount);
    }

    if (!params.authorityAddress) {
      throw new BuildTransactionError('Operation requires authorityAddress');
    }
    validateAddress(params.authorityAddress, 'authorityAddress');
  }

  /**
   * Validates operation-specific fields based on type
   */
  private validateOperationSpecificFields(operation: MintTo | Burn): void {
    if (operation.type === InstructionBuilderTypes.MintTo) {
      this.validateMintOperation(operation);
    } else if (operation.type === InstructionBuilderTypes.Burn) {
      this.validateBurnOperation(operation);
    } else {
      throw new BuildTransactionError(`Unsupported operation type: ${String((operation as { type: string }).type)}`);
    }
  }

  /**
   * Validates mint-specific fields
   */
  private validateMintOperation(operation: MintTo): void {
    if (!operation.params.destinationAddress) {
      throw new BuildTransactionError('Mint operation requires destinationAddress');
    }
    validateAddress(operation.params.destinationAddress, 'destinationAddress');
  }

  /**
   * Validates burn-specific fields
   */
  private validateBurnOperation(operation: Burn): void {
    if (!operation.params.accountAddress) {
      throw new BuildTransactionError('Burn operation requires accountAddress');
    }
    validateAddress(operation.params.accountAddress, 'accountAddress');
  }

  /**
   * Validates token information (name or mint address)
   */
  private validateTokenInformation(operation: MintTo | Burn): void {
    const params = operation.params;
    if (!params.tokenName && !params.mintAddress) {
      throw new BuildTransactionError('Either tokenName or mintAddress must be provided');
    }

    if (params.tokenName) {
      const token = getSolTokenFromTokenName(params.tokenName);
      if (!token && !params.mintAddress) {
        throw new BuildTransactionError('Invalid token name or missing mintAddress: ' + params.tokenName);
      }
    }

    if (params.mintAddress) {
      validateMintAddress(params.mintAddress);
    }
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);

    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.MintTo) {
        this.addOperation(instruction as MintTo);
      } else if (instruction.type === InstructionBuilderTypes.Burn) {
        this.addOperation(instruction as Burn);
      }
    }
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._operations.length > 0, 'At least one SPL token operation must be specified');

    const instructions = this._operations.map((operation) => this.processOperation(operation));

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
   * Processes an operation to ensure it has complete token information
   */
  private processOperation(operation: MintTo | Burn): MintTo | Burn {
    const tokenInfo = this.resolveTokenInfo(operation);
    const operationType = operation.type;
    switch (operationType) {
      case InstructionBuilderTypes.MintTo:
        return this.enrichMintInstruction(operation, tokenInfo);
      case InstructionBuilderTypes.Burn:
        return this.enrichBurnInstruction(operation, tokenInfo);
      default:
        throw new BuildTransactionError(`Unsupported operation type: ${operationType}`);
    }
  }

  /**
   * Resolves token information from operation
   */
  private resolveTokenInfo(operation: MintTo | Burn): {
    mintAddress: string;
    tokenName: string;
    programId?: string;
  } {
    const params = operation.params;
    if (params.mintAddress) {
      return {
        mintAddress: params.mintAddress,
        tokenName: params.tokenName || params.mintAddress,
        programId: params.programId,
      };
    } else if (params.tokenName) {
      const token = getSolTokenFromTokenName(params.tokenName);
      if (token) {
        return {
          mintAddress: token.tokenAddress,
          tokenName: token.name,
          programId: token.programId,
        };
      } else {
        throw new BuildTransactionError('Invalid token name: ' + params.tokenName);
      }
    } else {
      throw new BuildTransactionError('Either tokenName or mintAddress must be provided');
    }
  }

  /**
   * Enriches a mint instruction with complete token information
   */
  private enrichMintInstruction(
    operation: MintTo,
    tokenInfo: { mintAddress: string; tokenName: string; programId?: string }
  ): MintTo {
    const params = {
      ...operation.params,
      mintAddress: tokenInfo.mintAddress,
      tokenName: tokenInfo.tokenName,
      programId: tokenInfo.programId || operation.params.programId,
    };

    return {
      type: InstructionBuilderTypes.MintTo,
      params,
    };
  }

  /**
   * Enriches a burn instruction with complete token information
   */
  private enrichBurnInstruction(
    operation: Burn,
    tokenInfo: { mintAddress: string; tokenName: string; programId?: string }
  ): Burn {
    const params = {
      ...operation.params,
      mintAddress: tokenInfo.mintAddress,
      tokenName: tokenInfo.tokenName,
      programId: tokenInfo.programId || operation.params.programId,
    };

    return {
      type: InstructionBuilderTypes.Burn,
      params,
    };
  }
}
