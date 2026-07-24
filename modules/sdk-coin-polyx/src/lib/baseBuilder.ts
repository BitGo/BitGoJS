import { TransactionBuilder } from '@bitgo/abstract-substrate';
import { Transaction } from './transaction';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { TxMethod } from './iface';
import utils from './utils';

/**
 * Base builder class for Polyx transactions
 * Extends the abstract-substrate TransactionBuilder with Polyx-specific functionality
 */
export abstract class PolyxBaseBuilder<M = TxMethod, T extends Transaction = Transaction> extends TransactionBuilder<
  M,
  T
> {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    // Override the transaction instance with our PolyX-specific Transaction
    this._transaction = new Transaction(_coinConfig) as T;
  }

  /**
   * Override the getAddressFormat method to return different values based on network type
   * Returns 12 for mainnet and 42 for testnet
   *
   * @returns {number} The address format to use
   */
  protected getAddressFormat(): number {
    return utils.getAddressFormat(this._coinConfig.name);
  }

  // These methods are abstract in the parent class and must be implemented by concrete subclasses
  protected abstract buildTransaction(): UnsignedTransaction;
  protected abstract get transactionType(): TransactionType;
  abstract validateDecodedTransaction(
    decodedTxn: DecodedSigningPayload | DecodedSignedTx,
    rawTransaction?: string
  ): void;
}
