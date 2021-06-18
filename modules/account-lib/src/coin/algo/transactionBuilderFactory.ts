import algosdk from 'algosdk';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { NotSupported } from '../baseCoin/errors';
import { BaseTransactionBuilderFactory } from '../baseCoin';
import { KeyRegistrationBuilder } from './keyRegistrationBuilder';
import { TransferBuilder } from './transferBuilder';
import { TransactionBuilder } from './transactionBuilder';
import { AssetTransferBuilder } from './assetTransferBuilder';
import Utils from './utils';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  getTransferBuilder(): TransferBuilder {
    return new TransferBuilder(this._coinConfig);
  }

  getAssetTransferBuilder(): AssetTransferBuilder {
    return new AssetTransferBuilder(this._coinConfig);
  }

  from(rawTxn: string | Uint8Array): TransactionBuilder {
    const builder = this.getBuilder(rawTxn);
    builder.from(rawTxn);

    return builder;
  }

  private getBuilder(rawTxn: string | Uint8Array): TransactionBuilder {
    const decodeTxn = Utils.decodeAlgoTxn(rawTxn);
    const algoTxn = decodeTxn.txn;
    if (algoTxn.type == algosdk.TransactionType.keyreg) {
      return this.getWalletInitializationBuilder();
    } else if (algoTxn.type == algosdk.TransactionType.pay) {
      return this.getTransferBuilder();
    } else if (algoTxn.type == algosdk.TransactionType.axfer) {
      return this.getAssetTransferBuilder();
    } else {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
  }

  public getWalletInitializationBuilder(): KeyRegistrationBuilder {
    return new KeyRegistrationBuilder(this._coinConfig);
  }
}
