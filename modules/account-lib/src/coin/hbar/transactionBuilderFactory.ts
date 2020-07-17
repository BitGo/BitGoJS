import { coins } from '@bitgo/statics';
import { WalletInitializationBuilder } from './walletInitializationBuilder';

export class TransactionBuilderFactory {
  // TODO: Add Hedera coin config
  private static _coinConfig = coins.get('eth');

  static getWalletInitializationBuilder(): WalletInitializationBuilder {
    return new WalletInitializationBuilder(this._coinConfig);
  }
}
