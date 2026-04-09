import { BaseTransactionBuilderFactory, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { Transaction } from './transaction';
import { TRANSFER_TRANSACTION_COMMANDS } from './constants';
import utils from './utils';
import { Transaction as IotaTransaction } from '@iota/iota-sdk/transactions';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

/**
 * Factory class for creating IOTA transaction builders.
 *
 * This factory provides methods to create transaction builders for different
 * transaction types and to reconstruct transactions from raw transaction data.
 *
 * @example
 * ```typescript
 * const factory = new TransactionBuilderFactory(coins.get('tiota'));
 *
 * // Create a new transfer builder
 * const builder = factory.getTransferBuilder();
 *
 * // Rebuild from raw transaction
 * const rebuiltBuilder = factory.from(rawTxHex);
 * ```
 */
export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /**
   * Wallet initialization is not implemented for IOTA.
   * IOTA wallets are initialized through the TSS flow.
   *
   * @throws Error always - not implemented
   */
  public getWalletInitializationBuilder(): void {
    throw new Error('Method not implemented.');
  }

  /**
   * Creates a transfer transaction builder.
   * Optionally initializes the builder with data from an existing transaction.
   *
   * @param tx - Optional existing transaction to initialize the builder
   * @returns A new TransferBuilder instance
   *
   * @example
   * ```typescript
   * // Create a new transfer builder
   * const builder = factory.getTransferBuilder();
   *
   * // Initialize from existing transaction
   * const existingTx = await builder.build();
   * const newBuilder = factory.getTransferBuilder(existingTx);
   * ```
   */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return this.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }

  /**
   * Reconstructs a transaction builder from raw transaction data.
   * Automatically identifies the transaction type and creates the appropriate builder.
   *
   * @param rawTx - Raw transaction data (hex string or Uint8Array)
   * @returns TransactionBuilder appropriate for the transaction type
   * @throws InvalidTransactionError if the transaction type is not supported
   *
   * @example
   * ```typescript
   * // From hex string
   * const builder = factory.from('0x1234...');
   *
   * // From Uint8Array
   * const builder = factory.from(new Uint8Array([...]));
   *
   * // Rebuild and access the transaction
   * const tx = await builder.build();
   * ```
   */
  from(rawTx: string | Uint8Array): TransactionBuilder {
    const rawTxBase64 = utils.getBase64String(rawTx);
    const transactionType = this.identifyTransactionType(rawTxBase64);

    switch (transactionType) {
      case TransactionType.Send:
        return this.createTransferBuilderFromRawTx(rawTxBase64);
      default:
        throw new InvalidTransactionError(`Unsupported transaction type: ${transactionType}`);
    }
  }

  /**
   * Identifies the transaction type by analyzing its commands.
   * Currently supports transfer transactions (Send type).
   *
   * @param rawTx - Raw transaction in base64 format
   * @returns The identified transaction type
   * @throws InvalidTransactionError if transaction contains unsupported commands
   */
  private identifyTransactionType(rawTx: string | Uint8Array): TransactionType {
    const txData = IotaTransaction.from(rawTx).getData();

    if (this.isTransferTransaction(txData)) {
      return TransactionType.Send;
    }

    throw new InvalidTransactionError('Transaction contains unsupported commands');
  }

  /**
   * Checks if a transaction is a transfer transaction by validating its commands.
   * Transfer transactions only contain: SplitCoins, MergeCoins, and TransferObjects commands.
   *
   * @param txData - The parsed transaction data
   * @returns true if all commands are valid transfer commands
   */
  private isTransferTransaction(txData: ReturnType<IotaTransaction['getData']>): boolean {
    return txData.commands.every((command) => TRANSFER_TRANSACTION_COMMANDS.includes(command.$kind));
  }

  /**
   * Creates a TransferBuilder from raw transaction data.
   *
   * @param rawTxBase64 - Raw transaction in base64 format
   * @returns Initialized TransferBuilder
   */
  private createTransferBuilderFromRawTx(rawTxBase64: string): TransferBuilder {
    const builder = new TransferBuilder(this._coinConfig);
    builder.fromImplementation(rawTxBase64);
    return builder;
  }

  /**
   * Initializes a builder with data from an existing transaction.
   * If no transaction is provided, returns the builder as-is.
   *
   * @param tx - Optional transaction to initialize from
   * @param builder - The builder to initialize
   * @returns The initialized builder
   */
  private initializeBuilder<T extends TransactionBuilder>(tx: Transaction | undefined, builder: T): T {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }
}
