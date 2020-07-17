import { BaseCoin as CoinConfig } from '@bitgo/statics';

export abstract class BaseTransactionBuilderFactory {
  protected _coinConfig: Readonly<CoinConfig>;
  /**
   * Base constructor.
   *
   * @param _coinConfig BaseCoin from statics library
   */
  protected constructor(_coinConfig: Readonly<CoinConfig>) {
    this._coinConfig = _coinConfig;
  }

  public abstract getWalletInitializationBuilder();
}
