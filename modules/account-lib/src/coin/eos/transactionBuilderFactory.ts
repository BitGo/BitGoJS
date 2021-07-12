import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilderFactory } from '../baseCoin';
import { EosTransactionBuilder } from './eosTransactionBuilder';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: Uint8Array | string): TransactionBuilder {
    const builder = new EosTransactionBuilder(this._coinConfig);
    builder.from(raw);
    return builder;
  }

  public getEosTransactionBuilder(): EosTransactionBuilder {
    return new EosTransactionBuilder(this._coinConfig);
  }

  /** @inheritdoc */
  public getTransferBuilder(): EosTransactionBuilder {
    return new EosTransactionBuilder(this._coinConfig);
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(tx?: Transaction): EosTransactionBuilder {
    return new EosTransactionBuilder(this._coinConfig);
  }
}
