// Install and import coin specific packages
import bitgo, { Network } from '@bitgo/utxo-lib';
import { <%= constructor %>Transaction } from './transaction';

const { UtxoTransactionBuilder } = bitgo

export class <%= constructor %>TransactionBuilder<TNumber extends number | bigint = number> extends UtxoTransactionBuilder<
  TNumber,
  <%= constructor %>Transaction<TNumber>
> {
  constructor(network: Network, txb?: UtxoTransactionBuilder) {
    super(network, txb);
  }
}
