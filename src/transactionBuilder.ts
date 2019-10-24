import { BaseCoin } from "./coin/baseCoin";
import { BaseAddress, BaseKey } from "./coin/baseCoin/iface";
import { CoinFactory } from "./coinFactory";
import { BaseTransaction } from "./transaction";

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
   * @param key the key associated with this transaction
   * @param fromAddress
   */
  sign(key: BaseKey, fromAddress: BaseAddress) {
    this.coin.validateAddress(fromAddress);
    this.coin.validateKey(key);

    this.transaction = this.coin.sign(key, fromAddress, this.transaction);
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
}
