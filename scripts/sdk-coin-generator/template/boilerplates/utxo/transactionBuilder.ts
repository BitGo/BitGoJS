// Install and import coin specific packages
import bitgo, { Network } from '@bitgo/utxo-lib';
import { <%= constructor %>Transaction } from './transaction';

const { UtxoTransactionBuilder } = bitgo

export class <%= constructor %>TransactionBuilder extends UtxoTransactionBuilder<number, <%= constructor %>Transaction> {
  constructor(network: Network, txb?: UtxoTransactionBuilder) {
    super(network, txb);
  }
}
