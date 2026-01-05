/**
 * TIP-20 Transaction
 *
 * Represents a Tempo Account Abstraction (AA) transaction (type 0x76)
 * Supports single or batch TIP-20 token transfers with memos
 */

import { BaseTransaction, ParseTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import type { Address, Hex, Tip20Operation } from './types';

/**
 * TIP-20 Transaction Request Structure
 * Represents the raw transaction data for Tempo Account Abstraction (EIP-7702)
 */
export interface Tip20TransactionRequest {
  /** Transaction type (0x76 for Tempo AA) */
  type: number | string;
  /** Chain ID for the Tempo network */
  chainId: number;
  /** Transaction nonce */
  nonce: number;
  /** Maximum fee per gas (EIP-1559) */
  maxFeePerGas: bigint;
  /** Maximum priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas: bigint;
  /** Gas limit for the transaction */
  gas: bigint;
  /** Array of calls to execute in this transaction */
  calls: { to: Address; data: Hex; value: bigint }[];
  /** Access list (optional, typically empty for TIP-20) */
  accessList?: unknown[];
  /** Optional TIP-20 token to use for paying fees */
  feeToken?: Address;
}

export class Tip20Transaction extends BaseTransaction {
  private txRequest: Tip20TransactionRequest;
  private _operations: Tip20Operation[];
  private _signature?: { r: Hex; s: Hex; yParity: number };

  constructor(_coinConfig: Readonly<CoinConfig>, request: Tip20TransactionRequest, operations: Tip20Operation[] = []) {
    super(_coinConfig);
    this.txRequest = request;
    this._operations = operations;
  }

  get type(): TransactionType {
    return TransactionType.Send;
  }

  canSign(): boolean {
    return true;
  }

  async serialize(signature?: { r: Hex; s: Hex; yParity: number }): Promise<Hex> {
    // TODO: Implement EIP-7702 transaction serialization
    throw new ParseTransactionError('Transaction serialization not yet implemented');
  }

  getOperations(): Tip20Operation[] {
    return [...this._operations];
  }

  getFeeToken(): Address | undefined {
    return this.txRequest.feeToken;
  }

  getOperationCount(): number {
    return this.txRequest.calls.length;
  }

  isBatch(): boolean {
    return this.txRequest.calls.length > 1;
  }

  setSignature(signature: { r: Hex; s: Hex; yParity: number }): void {
    this._signature = signature;
  }

  getSignature(): { r: Hex; s: Hex; yParity: number } | undefined {
    return this._signature;
  }

  toJson(): Record<string, unknown> {
    return {
      type: this.txRequest.type,
      chainId: this.txRequest.chainId,
      nonce: this.txRequest.nonce,
      maxFeePerGas: this.txRequest.maxFeePerGas.toString(),
      maxPriorityFeePerGas: this.txRequest.maxPriorityFeePerGas.toString(),
      gas: this.txRequest.gas.toString(),
      callCount: this.txRequest.calls.length,
      feeToken: this.txRequest.feeToken,
      operations: this._operations,
      signature: this._signature,
    };
  }

  async toBroadcastFormat(): Promise<string> {
    return await this.serialize(this._signature);
  }

  get id(): string {
    return 'pending';
  }

  toString(): string {
    return JSON.stringify(this.toJson(), null, 2);
  }

  canBroadcast(): boolean {
    return this.txRequest.calls.length > 0 && this.txRequest.chainId > 0;
  }
}
