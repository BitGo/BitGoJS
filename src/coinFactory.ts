import { BaseCoin } from "./coin/baseCoin";
import { Trx, Ttrx } from "./coin/trx";
import { TestCoin } from "./coin/testcoin";

/**
 * We "hide" this class from the outside world because we don't really want it being called directly.
 * It's only exposed as a static provider.
 */
export abstract class CoinFactory {
  public static getCoin(coinName: string): BaseCoin {
    switch (coinName.toLowerCase().trim()) {
      case 'ttrx':
        return new Ttrx();
      case 'trx':
        return new Trx();
      case 'test':
        return new TestCoin();
      default:
        throw new Error(`Coin ${coinName} not supported`);
    }
  }
}
