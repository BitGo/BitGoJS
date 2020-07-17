import { BaseTransactionBuilderFactory } from '../baseCoin';
import { WalletInitializationBuilder } from './walletInitializationBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  getWalletInitializationBuilder(): WalletInitializationBuilder {
    return new WalletInitializationBuilder(this._coinConfig);
  }
}
