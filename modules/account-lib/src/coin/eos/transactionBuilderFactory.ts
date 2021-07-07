import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilderFactory } from '../baseCoin';
import { NotImplementedError } from '../baseCoin/errors';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { EosTransactionBuilder } from './eosTransactionBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  public getTransferBuilder(): EosTransactionBuilder {
    return new EosTransactionBuilder(this._coinConfig);
  }
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: Uint8Array | string): TransactionBuilder {
    const builder = new EosTransactionBuilder(this._coinConfig);
    builder.from(raw);
    return builder;
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(tx?: Transaction): void {
    throw new NotImplementedError('wallet not implemented');
  }
}
