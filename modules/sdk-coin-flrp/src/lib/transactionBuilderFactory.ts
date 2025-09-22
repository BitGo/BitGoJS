import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import { NotImplementedError, TransactionType } from '@bitgo-beta/sdk-core';
import { AtomicTransactionBuilder } from './atomicTransactionBuilder';

// Placeholder builders - basic implementations for testing
export class ExportTxBuilder extends AtomicTransactionBuilder {
  protected get transactionType(): TransactionType {
    return TransactionType.Export;
  }

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    // Don't throw error, allow placeholder functionality
  }
}

export class ImportTxBuilder extends AtomicTransactionBuilder {
  protected get transactionType(): TransactionType {
    return TransactionType.Import;
  }

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    // Don't throw error, allow placeholder functionality
  }
}

export class ValidatorTxBuilder extends AtomicTransactionBuilder {
  protected get transactionType(): TransactionType {
    return TransactionType.AddValidator;
  }

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    // Don't throw error, allow placeholder functionality
  }
}

export class DelegatorTxBuilder extends AtomicTransactionBuilder {
  protected get transactionType(): TransactionType {
    return TransactionType.AddDelegator;
  }

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    // Don't throw error, allow placeholder functionality
  }
}

/**
 * Factory for Flare P-chain transaction builders
 */
export class TransactionBuilderFactory {
  protected _coinConfig: Readonly<CoinConfig>;

  constructor(coinConfig: Readonly<CoinConfig>) {
    this._coinConfig = coinConfig;
  }

  /**
   * Create a transaction builder from a hex string
   * @param txHex - Transaction hex string
   */
  from(txHex: string): AtomicTransactionBuilder {
    // TODO: Parse the hex and determine transaction type, then return appropriate builder
    // For now, return a basic export builder as that's the most common use case
    if (!txHex) {
      throw new Error('Transaction hex is required');
    }

    // Create a mock export builder for now
    // In the future, this will parse the transaction and determine the correct type
    const builder = new ExportTxBuilder(this._coinConfig);

    // Initialize with the hex data (placeholder)
    builder.initBuilder({ txHex });

    return builder;
  }

  /**
   * Create a transaction builder for a specific type
   * @param type - Transaction type
   */
  getBuilder(type: TransactionType): AtomicTransactionBuilder {
    switch (type) {
      case TransactionType.Export:
        return new ExportTxBuilder(this._coinConfig);
      case TransactionType.Import:
        return new ImportTxBuilder(this._coinConfig);
      case TransactionType.AddValidator:
        return new ValidatorTxBuilder(this._coinConfig);
      case TransactionType.AddDelegator:
        return new DelegatorTxBuilder(this._coinConfig);
      default:
        throw new NotImplementedError(`Transaction type ${type} not supported`);
    }
  }
}
