import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { Eth } from '../../index';
import { Utils } from '../eth';
import { TransactionType } from '../baseCoin';
import { Transaction } from './transaction';

export class TransactionBuilder extends Eth.TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction = new Transaction(this._coinConfig);
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    let tx: Transaction;
    if (/^0x?[0-9a-f]{1,}$/.test(rawTransaction.toLowerCase())) {
      tx = Transaction.fromSerialized(this._coinConfig, rawTransaction);
      const transactionJson = tx.toJson();
      console.log('TX_JSON ', transactionJson);
      const decodedType = Utils.classifyTransaction(transactionJson.data);
      this.type(decodedType);
      switch (decodedType) {
        case TransactionType.WalletInitialization:
          this.fee({ fee: transactionJson.gasPrice, gasLimit: transactionJson.gasLimit });
          this.counter(transactionJson.nonce);
          this.chainId(Number(transactionJson.chainId));
          const owners = Utils.decodeWalletCreationData(transactionJson.data);
          owners.forEach(element => {
            this.owner(element);
          });
          break;
        //TODO: Add other cases of deserialization
      }
    } else {
      const txData = JSON.parse(rawTransaction);
      tx = new Transaction(this._coinConfig, txData);
    }
    return tx;
  }
}
