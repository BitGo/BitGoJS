import { BaseCoin as CoinConfig } from '@bitgo/statics';
import RippleBinaryCodec from 'ripple-binary-codec';
import * as rippleTypes from 'ripple-lib/dist/npm/transaction/types';
import { BaseTransactionBuilderFactory } from '../baseCoin';
import { NotSupported } from '../baseCoin/errors';
import { TransferBuilder } from './transferBuilder';
import { WalletInitializationBuilder } from './walletInitializationBuilder';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { MultiSigBuilder } from './multiSigBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  from(rawTxn: string): TransactionBuilder {
    const builder = this.getBuilder(rawTxn);
    builder.from(rawTxn);
    return builder;
  }

  private getBuilder(rawTxn: string): TransactionBuilder {
    try {
      const decodedXrpTrx = RippleBinaryCodec.decode(rawTxn) as rippleTypes.TransactionJSON;
      switch (decodedXrpTrx.TransactionType) {
        case 'Payment':
          return this.getTransferBuilder();
        case 'AccountSet':
          return this.getWalletInitializationBuilder();
        case 'SignerListSet':
          return this.getMultiSigBuilder();
        default:
          throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
      }
    } catch (e) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(tx?: Transaction): WalletInitializationBuilder {
    return new WalletInitializationBuilder(this._coinConfig);
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return new TransferBuilder(this._coinConfig);
  }

  /** @inheritdoc */
  getMultiSigBuilder(tx?: Transaction): MultiSigBuilder {
    return new MultiSigBuilder(this._coinConfig);
  }
}
