import { BaseCoin } from "./coin/baseCoin";
import { BaseAddress, BaseKey } from "./coin/baseCoin/iface";
import { CoinFactory } from "./coinFactory";
import { BaseTransaction } from "./transaction";
import {SigningError} from "./coin/baseCoin/errors";

export interface TransactionBuilderParams {
  coinName: string;
}

/**
 * Generic transaction builder.
 */
export class TransactionBuilder {
  private transaction: BaseTransaction;
  private coin: BaseCoin;

  /**
   * Public constructor. It will initialize the correct builder based on the coin.
   *
   * @param options
   */
  constructor(options: TransactionBuilderParams) {
    this.coin = CoinFactory.getCoin(options.coinName);
  }

  /**
   * Build a transaction based on existing data. The input format will depend on the coin, and it
   * could be hex, base64, JSON, etc.
   * @param rawTransaction
   */
  from(rawTransaction: any) {
    this.transaction = this.coin.parseTransaction(rawTransaction);
  }

  /**
   * Signs the transaction in our builder.
   * @param key one of the keys associated with this transaction
   */
  sign(key: BaseKey) {
    // Make sure the key is valid
    this.coin.validateKey(key);
    if (!this.transaction.canSign(key)) {
      throw new SigningError('Private key cannot sign the transaction');
    }

    this.transaction = this.coin.sign(key, this.transaction);
  }

  /**
   * Finalize the transaction by performing any extra step like calculating hashes, verifying
   * integrity, or adding default values.
   * @return transaction object
   */
  build(): BaseTransaction {
    this.transaction = this.coin.buildTransaction(this.transaction);
    return this.transaction;
  }

  /**
   * Extend the validity of this transaction by the given amount of time
   * @param extensionMs The number of milliseconds to extend the validTo time
   */
  extendValidTo(extensionMs: number) {
    this.transaction = this.coin.extendTransaction(this.transaction, extensionMs);
  }
}
