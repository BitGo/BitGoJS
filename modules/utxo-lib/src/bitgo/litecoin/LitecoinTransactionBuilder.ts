import * as bitcoinjs from 'bitcoinjs-lib';

import { UtxoTransactionBuilder } from '../UtxoTransactionBuilder';
import { Network } from '../../networks';
import { UtxoTransaction } from '../UtxoTransaction';
import { LitecoinTransaction } from './LitecoinTransaction';

export class LitecoinTransactionBuilder<TNumber extends number | bigint = number> extends UtxoTransactionBuilder<
  TNumber,
  LitecoinTransaction<TNumber>
> {
  protected static newTransactionBuilder<TNumber extends number | bigint>(
    network: Network,
    tx: UtxoTransaction<TNumber>
  ): LitecoinTransactionBuilder<TNumber> {
    return new LitecoinTransactionBuilder<TNumber>(network, tx);
  }

  protected createInitialTransaction(
    network: Network,
    tx?: bitcoinjs.Transaction<TNumber>
  ): LitecoinTransaction<TNumber> {
    return new LitecoinTransaction<TNumber>(network, tx as LitecoinTransaction<TNumber>);
  }
}
