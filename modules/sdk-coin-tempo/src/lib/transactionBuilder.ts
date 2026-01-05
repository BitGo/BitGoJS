/**
 * TIP-20 Transaction Builder
 *
 * Unified builder for TIP-20 transactions supporting:
 * - Single or batch operations
 * - Per-operation memos for tracking
 * - Custom fee token selection
 * - EIP-7702 Account Abstraction (type 0x76)
 */

import { TransactionBuilder as AbstractTransactionBuilder, TransferBuilder } from '@bitgo/abstract-eth';
import { BaseTransaction, BuildTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import type { Address, Hex, Tip20Operation } from './types';
import { Tip20Transaction, Tip20TransactionRequest } from './transaction';
import { amountToTip20Units, encodeTip20TransferWithMemo, isValidAddress, isValidTip20Amount } from './utils';
import { AA_TRANSACTION_TYPE } from './constants';

/**
 * Transaction Builder for TIP-20 tokens on Tempo blockchain
 * Extends abstract-eth TransactionBuilder with Tempo-specific features
 */
export class Tip20TransactionBuilder extends AbstractTransactionBuilder {
  private operations: Tip20Operation[] = [];
  private _feeToken?: Address;
  private _nonce?: number;
  private _gas?: bigint;
  private _maxFeePerGas?: bigint;
  private _maxPriorityFeePerGas?: bigint;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Implement the transfer method from abstract class
   * Note: For TIP-20 transactions, use addOperation() instead
   */
  transfer(data?: string, isFirstSigner?: boolean): TransferBuilder {
    const transferBuilder = new TransferBuilder(undefined, isFirstSigner);
    if (data) {
      transferBuilder.data(data);
    }
    this._transfer = transferBuilder;
    return transferBuilder;
  }

  /**
   * Build the transaction from configured TIP-20 operations and transaction parameters
   */
  protected async buildImplementation(): Promise<BaseTransaction> {
    if (this.operations.length === 0) {
      throw new BuildTransactionError('At least one operation is required to build a transaction');
    }

    if (this._nonce === undefined) {
      throw new BuildTransactionError('Nonce is required to build a transaction');
    }

    if (this._gas === undefined) {
      throw new BuildTransactionError('Gas limit is required to build a transaction');
    }

    if (this._maxFeePerGas === undefined) {
      throw new BuildTransactionError('maxFeePerGas is required to build a transaction');
    }

    if (this._maxPriorityFeePerGas === undefined) {
      throw new BuildTransactionError('maxPriorityFeePerGas is required to build a transaction');
    }

    const calls = this.operations.map((op) => this.operationToCall(op));

    const txRequest: Tip20TransactionRequest = {
      type: AA_TRANSACTION_TYPE,
      chainId: this._common.chainIdBN().toNumber(),
      nonce: this._nonce,
      maxFeePerGas: this._maxFeePerGas,
      maxPriorityFeePerGas: this._maxPriorityFeePerGas,
      gas: this._gas,
      calls,
      accessList: [],
      feeToken: this._feeToken,
    };

    return new Tip20Transaction(this._coinConfig, txRequest, this.operations);
  }

  /**
   * Add a single operation to the transaction
   * Can be called multiple times to create batch transactions
   *
   * @param operation - TIP-20 operation with token, recipient, amount, and optional memo
   * @returns this builder instance for chaining
   */
  addOperation(operation: Tip20Operation): this {
    this.validateOperation(operation);
    this.operations.push(operation);
    return this;
  }

  /**
   * Set which TIP-20 token will be used to pay transaction fees
   * This is a global setting for the entire transaction
   *
   * @param tokenAddress - Address of the TIP-20 token to use for fees
   * @returns this builder instance for chaining
   */
  feeToken(tokenAddress: string): this {
    if (!isValidAddress(tokenAddress)) {
      throw new BuildTransactionError(`Invalid fee token address: ${tokenAddress}`);
    }
    this._feeToken = tokenAddress as Address;
    return this;
  }

  /**
   * Set the transaction nonce
   *
   * @param nonce - Transaction nonce
   * @returns this builder instance for chaining
   */
  nonce(nonce: number): this {
    if (nonce < 0) {
      throw new BuildTransactionError(`Invalid nonce: ${nonce}`);
    }
    this._nonce = nonce;
    return this;
  }

  /**
   * Set the gas limit for the transaction
   *
   * @param gas - Gas limit
   * @returns this builder instance for chaining
   */
  gas(gas: string | bigint): this {
    const gasValue = typeof gas === 'string' ? BigInt(gas) : gas;
    if (gasValue <= 0n) {
      throw new BuildTransactionError(`Invalid gas limit: ${gas}`);
    }
    this._gas = gasValue;
    return this;
  }

  /**
   * Set the maximum fee per gas (EIP-1559)
   *
   * @param maxFeePerGas - Maximum fee per gas in wei
   * @returns this builder instance for chaining
   */
  maxFeePerGas(maxFeePerGas: string | bigint): this {
    const feeValue = typeof maxFeePerGas === 'string' ? BigInt(maxFeePerGas) : maxFeePerGas;
    if (feeValue < 0n) {
      throw new BuildTransactionError(`Invalid maxFeePerGas: ${maxFeePerGas}`);
    }
    this._maxFeePerGas = feeValue;
    return this;
  }

  /**
   * Set the maximum priority fee per gas (EIP-1559)
   *
   * @param maxPriorityFeePerGas - Maximum priority fee per gas in wei
   * @returns this builder instance for chaining
   */
  maxPriorityFeePerGas(maxPriorityFeePerGas: string | bigint): this {
    const feeValue = typeof maxPriorityFeePerGas === 'string' ? BigInt(maxPriorityFeePerGas) : maxPriorityFeePerGas;
    if (feeValue < 0n) {
      throw new BuildTransactionError(`Invalid maxPriorityFeePerGas: ${maxPriorityFeePerGas}`);
    }
    this._maxPriorityFeePerGas = feeValue;
    return this;
  }

  /**
   * Get all operations in this transaction
   * @returns Array of TIP-20 operations
   */
  getOperations(): Tip20Operation[] {
    return [...this.operations];
  }

  /**
   * Get the fee token address if set
   * @returns Fee token address or undefined
   */
  getFeeToken(): Address | undefined {
    return this._feeToken;
  }

  /**
   * Validate a single operation
   * @param operation - Operation to validate
   * @throws BuildTransactionError if invalid
   */
  private validateOperation(operation: Tip20Operation): void {
    if (!isValidAddress(operation.token)) {
      throw new BuildTransactionError(`Invalid token address: ${operation.token}`);
    }

    if (!isValidAddress(operation.to)) {
      throw new BuildTransactionError(`Invalid recipient address: ${operation.to}`);
    }

    if (!isValidTip20Amount(operation.amount)) {
      throw new BuildTransactionError(`Invalid amount: ${operation.amount}`);
    }

    // Validate memo byte length (handles multi-byte UTF-8 characters)
    if (operation.memo) {
      const memoByteLength = new TextEncoder().encode(operation.memo).length;
      if (memoByteLength > 32) {
        throw new BuildTransactionError(`Memo too long: ${memoByteLength} bytes. Maximum 32 bytes.`);
      }
    }
  }

  /**
   * Convert a TIP-20 operation to an AA call
   */
  private operationToCall(op: Tip20Operation): { to: Address; data: Hex; value: bigint } {
    const amountInUnits = amountToTip20Units(op.amount);
    const data = encodeTip20TransferWithMemo(op.to, amountInUnits, op.memo);

    return {
      to: op.token,
      data,
      value: 0n,
    };
  }
}
