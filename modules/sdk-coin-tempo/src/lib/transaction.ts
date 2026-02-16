/**
 * TIP-20 Transaction
 *
 * Represents a Tempo Account Abstraction (AA) transaction (type 0x76)
 * Supports single or batch TIP-20 token transfers with memos
 */

import { BaseTransaction, ParseTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { ethers } from 'ethers';
import { Address, Hex, Tip20Operation } from './types';

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
    const sig = signature || this._signature;
    return this.serializeTransaction(sig);
  }

  /**
   * Encode calls as RLP tuples for atomic batch execution
   * @returns Array of [to, value, data] tuples
   * @private
   */
  private encodeCallsAsTuples(): any[] {
    return this.txRequest.calls.map((call) => [call.to, this.bigintToHex(call.value), call.data]);
  }

  /**
   * Encode EIP-2930 access list as RLP tuples
   * @returns Array of [address, storageKeys[]] tuples
   * @private
   */
  private encodeAccessList(): any[] {
    return (this.txRequest.accessList ?? []).map((item: any) => [item.address, item.storageKeys || []]);
  }

  /**
   * Convert bigint to hex string for RLP encoding
   * @param value bigint value to convert
   * @returns Hex string
   * @private
   */
  private bigintToHex(value: bigint): string {
    if (value === 0n) {
      return '0x';
    }
    const hex = value.toString(16);
    return '0x' + (hex.length % 2 ? '0' : '') + hex;
  }

  /**
   * Build base RLP data array per Tempo EIP-7702 specification
   * @param callsTuples Encoded calls
   * @param accessTuples Encoded access list
   * @returns RLP-ready array of transaction fields
   * @private
   */
  private buildBaseRlpData(callsTuples: any[], accessTuples: any[]): any[] {
    return [
      ethers.utils.hexlify(this.txRequest.chainId),
      this.txRequest.maxPriorityFeePerGas ? this.bigintToHex(this.txRequest.maxPriorityFeePerGas) : '0x',
      this.bigintToHex(this.txRequest.maxFeePerGas),
      this.bigintToHex(this.txRequest.gas),
      callsTuples,
      accessTuples,
      '0x', // nonceKey (reserved for 2D nonce system)
      ethers.utils.hexlify(this.txRequest.nonce),
      '0x', // validBefore (reserved for time bounds)
      '0x', // validAfter (reserved for time bounds)
      this.txRequest.feeToken || '0x',
      '0x', // feePayerSignature (reserved for sponsorship)
      [], // authorizationList (EIP-7702)
    ];
  }

  /**
   * Encode secp256k1 signature as 65-byte envelope
   * @param signature ECDSA signature components
   * @returns Hex string of concatenated r (32) + s (32) + v (1) bytes
   * @private
   */
  private encodeSignature(signature: { r: Hex; s: Hex; yParity: number }): string {
    const v = signature.yParity + 27;
    const signatureBytes = ethers.utils.concat([
      ethers.utils.zeroPad(signature.r, 32),
      ethers.utils.zeroPad(signature.s, 32),
      ethers.utils.hexlify(v),
    ]);
    return ethers.utils.hexlify(signatureBytes);
  }

  /**
   * RLP encode and prepend transaction type byte
   * @param rlpData Transaction fields array
   * @returns Hex string with 0x76 prefix
   * @private
   */
  private rlpEncodeWithTypePrefix(rlpData: any[]): Hex {
    try {
      const encoded = ethers.utils.RLP.encode(rlpData);
      return ('0x76' + encoded.slice(2)) as Hex;
    } catch (error) {
      throw new ParseTransactionError(`Failed to RLP encode transaction: ${error}`);
    }
  }

  /**
   * Serialize Tempo AA transaction (type 0x76) per EIP-7702 specification
   * Format: 0x76 || RLP([chainId, fees, gas, calls, accessList, nonce fields, feeToken, sponsorship, authList, signature?])
   * @param signature Optional ECDSA signature (omit for unsigned transactions)
   * @returns RLP-encoded transaction hex string
   * @private
   */
  private serializeTransaction(signature?: { r: Hex; s: Hex; yParity: number }): Hex {
    const callsTuples = this.encodeCallsAsTuples();
    const accessTuples = this.encodeAccessList();
    const rlpData = this.buildBaseRlpData(callsTuples, accessTuples);

    if (signature) {
      rlpData.push(this.encodeSignature(signature));
    }

    return this.rlpEncodeWithTypePrefix(rlpData);
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
