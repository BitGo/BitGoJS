import { BaseCoin } from "./coin/baseCoin";
import { BuildTransactionError } from "./coin/baseCoin/errors";
import { TransactionBuilder } from "./coin/trx/transactionBuilder";
import { coins } from "@bitgo/statics";

/**
 * We "hide" this class from the outside world because we don't really want it being called directly.
 * It's only exposed as a static provider.
 */
export abstract class CoinFactory {
  public static getCoin(coinName: string): BaseCoin {
    switch (coinName.toLowerCase().trim()) {
      case 'ttrx':
        return new TransactionBuilder(coins.get('ttrx'));
      case 'trx':
        return new TransactionBuilder(coins.get('trx'));
      default:
        throw new BuildTransactionError(`Coin ${coinName} not supported`);
    }
  }
}
