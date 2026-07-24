import * as bitcoinjs from 'bitcoinjs-lib';
import { Network } from '../../networks';
import { UtxoTransactionBuilder } from '../UtxoTransactionBuilder';
import { DashTransaction } from './DashTransaction';
import { UtxoTransaction } from '../UtxoTransaction';

export class DashTransactionBuilder<TNumber extends number | bigint = number> extends UtxoTransactionBuilder<
  TNumber,
  DashTransaction<TNumber>
> {
  constructor(network: Network, tx?: UtxoTransaction<TNumber>) {
    super(network, tx);
    if (tx instanceof DashTransaction) {
      this.setType(tx.type);
      this.setExtraPayload(tx.extraPayload);
    }
  }

  protected static newTransactionBuilder<TNumber extends number | bigint>(
    network: Network,
    tx: UtxoTransaction<TNumber>
  ): DashTransactionBuilder<TNumber> {
    return new DashTransactionBuilder<TNumber>(network, tx);
  }

  protected createInitialTransaction(network: Network, tx?: bitcoinjs.Transaction<TNumber>): DashTransaction<TNumber> {
    return new DashTransaction<TNumber>(network, tx);
  }

  setType(type: number): void {
    this.tx.type = type;
  }

  setExtraPayload(extraPayload?: Buffer): void {
    this.tx.extraPayload = extraPayload;
  }
}
