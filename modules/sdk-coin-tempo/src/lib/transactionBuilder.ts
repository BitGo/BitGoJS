/**
 * TIP-20 Transaction Builder
 *
 * Unified builder for TIP-20 transactions supporting:
 * - Single or batch operations
 * - Per-operation memos for tracking
 * - Custom fee token selection
 * - EIP-7702 Account Abstraction (type 0x76)
 */

import {
  Transaction as EthTransaction,
  TransactionBuilder as AbstractTransactionBuilder,
  TransferBuilder,
} from '@bitgo/abstract-eth';
import {
  BaseTransaction,
  BuildTransactionError,
  InvalidTransactionError,
  ParseTransactionError,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { ethers } from 'ethers';
import { Address, Hex, RawContractCall, Tip20Operation } from './types';
import { Tip20Transaction, Tip20TransactionRequest } from './transaction';
import {
  amountToTip20Units,
  encodeTip20TransferWithMemo,
  isTip20Transaction,
  isValidAddress,
  isValidHexData,
  isValidMemoId,
  isValidTip20Amount,
  tip20UnitsToAmount,
} from './utils';
import { TIP20_TRANSFER_WITH_MEMO_ABI } from './tip20Abi';
import { AA_TRANSACTION_TYPE } from './constants';

/**
 * Transaction Builder for TIP-20 tokens on Tempo blockchain
 * Extends abstract-eth TransactionBuilder with Tempo-specific features
 */
export class Tip20TransactionBuilder extends AbstractTransactionBuilder {
  private operations: Tip20Operation[] = [];
  private rawCalls: RawContractCall[] = [];
  private _feeToken?: Address;
  private _nonce?: number;
  private _gas?: bigint;
  private _maxFeePerGas?: bigint;
  private _maxPriorityFeePerGas?: bigint;
  private _restoredSignature?: { r: Hex; s: Hex; yParity: number };

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
   * Validate the transaction has all required fields for Tempo AA transactions.
   * Overrides parent class validation since AA transactions use a different model
   * (operations-based rather than single contract address).
   *
   * @throws BuildTransactionError if validation fails
   */
  validateTransaction(): void {
    if (this.operations.length === 0 && this.rawCalls.length === 0) {
      throw new BuildTransactionError('At least one operation or raw call is required to build a transaction');
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
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    if (typeof rawTransaction === 'string' && isTip20Transaction(rawTransaction)) {
      try {
        ethers.utils.RLP.decode('0x' + rawTransaction.slice(4));
        return;
      } catch (e) {
        throw new ParseTransactionError(`Failed to RLP decode TIP-20 transaction: ${e}`);
      }
    }
    super.validateRawTransaction(rawTransaction);
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string, isFirstSigner?: boolean): EthTransaction {
    if (!rawTransaction) {
      throw new InvalidTransactionError('Raw transaction is empty');
    }
    if (isTip20Transaction(rawTransaction)) {
      return this.fromTip20Transaction(rawTransaction) as unknown as EthTransaction;
    }
    return super.fromImplementation(rawTransaction, isFirstSigner);
  }

  /**
   * Deserialize a type 0x76 transaction and restore builder state.
   * RLP field layout mirrors buildBaseRlpData() in transaction.ts.
   */
  private fromTip20Transaction(rawTransaction: string): Tip20Transaction {
    try {
      const rlpHex = '0x' + rawTransaction.slice(4);
      const decoded = ethers.utils.RLP.decode(rlpHex) as any[];

      if (!Array.isArray(decoded) || decoded.length < 13) {
        throw new ParseTransactionError('Invalid TIP-20 transaction: unexpected RLP structure');
      }

      const parseBigInt = (hex: string): bigint => (!hex || hex === '0x' ? 0n : BigInt(hex));
      const parseHexInt = (hex: string): number => (!hex || hex === '0x' ? 0 : parseInt(hex, 16));

      const chainId = parseHexInt(decoded[0] as string);
      const maxPriorityFeePerGas = parseBigInt(decoded[1] as string);
      const maxFeePerGas = parseBigInt(decoded[2] as string);
      const gas = parseBigInt(decoded[3] as string);
      const callsTuples = decoded[4] as string[][];
      const nonce = parseHexInt(decoded[7] as string);
      const feeTokenRaw = decoded[10] as string;

      const calls: { to: Address; data: Hex; value: bigint }[] = callsTuples.map((tuple) => ({
        to: tuple[0] as Address,
        value: parseBigInt(tuple[1] as string),
        data: tuple[2] as Hex,
      }));

      const operations: Tip20Operation[] = [];
      const decodedRawCalls: RawContractCall[] = [];
      for (const call of calls) {
        const op = this.decodeCallToOperation(call);
        if (op !== null) {
          operations.push(op);
        } else {
          decodedRawCalls.push({ to: call.to, data: call.data, value: call.value.toString() });
        }
      }

      let signature: { r: Hex; s: Hex; yParity: number } | undefined;
      if (decoded.length >= 14 && decoded[13] && (decoded[13] as string).length > 2) {
        const sigBytes = ethers.utils.arrayify(decoded[13] as string);
        if (sigBytes.length === 65) {
          const r = ethers.utils.hexlify(sigBytes.slice(0, 32)) as Hex;
          const s = ethers.utils.hexlify(sigBytes.slice(32, 64)) as Hex;
          const v = sigBytes[64];
          const yParity = v > 1 ? v - 27 : v;
          signature = { r, s, yParity };
        }
      }

      const feeToken = feeTokenRaw && feeTokenRaw !== '0x' ? (feeTokenRaw as Address) : undefined;

      const txRequest: Tip20TransactionRequest = {
        type: AA_TRANSACTION_TYPE,
        chainId,
        nonce,
        maxFeePerGas,
        maxPriorityFeePerGas,
        gas,
        calls,
        accessList: [],
        feeToken,
      };

      this._nonce = nonce;
      this._gas = gas;
      this._maxFeePerGas = maxFeePerGas;
      this._maxPriorityFeePerGas = maxPriorityFeePerGas;
      this._feeToken = feeToken;
      this.operations = operations;
      this.rawCalls = decodedRawCalls;
      this._restoredSignature = signature;

      const tx = new Tip20Transaction(this._coinConfig, txRequest, operations, decodedRawCalls);
      if (signature) {
        tx.setSignature(signature);
      }
      return tx;
    } catch (e) {
      if (e instanceof ParseTransactionError) throw e;
      throw new ParseTransactionError(`Failed to deserialize TIP-20 transaction: ${e}`);
    }
  }

  /**
   * Decode a single AA call's data back into a Tip20Operation.
   * Returns null if the call is not a transferWithMemo — it will be stored as a RawContractCall instead.
   * This preserves calldata fidelity for arbitrary smart contract interactions.
   */
  private decodeCallToOperation(call: { to: Address; data: Hex; value: bigint }): Tip20Operation | null {
    const iface = new ethers.utils.Interface(TIP20_TRANSFER_WITH_MEMO_ABI);
    try {
      const decoded = iface.decodeFunctionData('transferWithMemo', call.data);
      const toAddress = decoded[0] as string;
      const amountUnits = BigInt(decoded[1].toString());
      const memoBytes32 = decoded[2] as string;

      const amount = tip20UnitsToAmount(amountUnits);

      const stripped = ethers.utils.stripZeros(memoBytes32);
      const memo = stripped.length > 0 ? ethers.utils.toUtf8String(stripped) : undefined;

      return { token: call.to, to: toAddress, amount, memo };
    } catch {
      // Not a transferWithMemo call — caller will store as RawContractCall
      return null;
    }
  }

  /**
   * Build the transaction from configured TIP-20 operations and transaction parameters.
   * Signs with _sourceKeyPair if it has been set via sign({ key }).
   */
  protected async buildImplementation(): Promise<BaseTransaction> {
    if (
      this._nonce === undefined ||
      this._gas === undefined ||
      this._maxFeePerGas === undefined ||
      this._maxPriorityFeePerGas === undefined
    ) {
      throw new BuildTransactionError('Transaction validation failed: missing required fields');
    }

    this.fee({
      fee: this._maxFeePerGas.toString(),
      gasLimit: this._gas.toString(),
      eip1559: {
        maxFeePerGas: this._maxFeePerGas.toString(),
        maxPriorityFeePerGas: this._maxPriorityFeePerGas.toString(),
      },
    });

    const calls = this.operations.map((op) => this.operationToCall(op));

    for (const rawCall of this.rawCalls) {
      calls.push({
        to: rawCall.to as Address,
        data: rawCall.data as Hex,
        value: rawCall.value ? BigInt(rawCall.value) : 0n,
      });
    }

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

    const tx = new Tip20Transaction(this._coinConfig, txRequest, this.operations, this.rawCalls);

    if (this._sourceKeyPair && this._sourceKeyPair.getKeys().prv) {
      const prv = this._sourceKeyPair.getKeys().prv!;
      const unsignedHex = await tx.serialize();
      const msgHash = ethers.utils.keccak256(ethers.utils.arrayify(unsignedHex));
      const signingKey = new ethers.utils.SigningKey('0x' + prv);
      const sig = signingKey.signDigest(ethers.utils.arrayify(msgHash));
      tx.setSignature({
        r: sig.r as Hex,
        s: sig.s as Hex,
        yParity: sig.recoveryParam ?? 0,
      });
    } else if (this._restoredSignature) {
      tx.setSignature(this._restoredSignature);
    }

    return tx;
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
   * Add a raw smart contract call with pre-encoded calldata
   * Use this for arbitrary contract interactions where the UI provides ABI-encoded calldata
   *
   * @param call - Raw contract call with target address and pre-encoded calldata
   * @returns this builder instance for chaining
   */
  addRawCall(call: RawContractCall): this {
    if (!isValidAddress(call.to)) {
      throw new BuildTransactionError(`Invalid contract address: ${call.to}`);
    }
    if (!isValidHexData(call.data)) {
      throw new BuildTransactionError(`Invalid calldata: must be a non-empty 0x-prefixed hex string`);
    }
    this.rawCalls.push(call);
    return this;
  }

  /**
   * Get all raw contract calls in this transaction
   * @returns Array of raw contract calls
   */
  getRawCalls(): RawContractCall[] {
    return [...this.rawCalls];
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

    if (operation.memo !== undefined && !isValidMemoId(operation.memo)) {
      throw new BuildTransactionError(`Invalid memo: must be a non-negative integer`);
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
