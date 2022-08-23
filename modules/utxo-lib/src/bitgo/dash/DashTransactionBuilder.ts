import * as bitcoinjs from 'bitcoinjs-lib';
import { Network } from '../../networks';
import { UtxoTransactionBuilder } from '../UtxoTransactionBuilder';
import { DashTransaction } from './DashTransaction';
import { UtxoTransaction } from '../UtxoTransaction';

export class DashTransactionBuilder<TNumber extends number | bigint = number> extends UtxoTransactionBuilder<
  TNumber,
  DashTransaction<TNumber>
> {
  constructor(network: Network, txb?: UtxoTransactionBuilder<TNumber>) {
    super(network, txb);
  }

  createInitialTransaction(network: Network, tx?: bitcoinjs.Transaction<TNumber>): DashTransaction<TNumber> {
    return new DashTransaction<TNumber>(network, tx as UtxoTransaction<TNumber>);
  }

  setType(type: number): void {
    this.tx.type = type;
  }

  setExtraPayload(extraPayload?: Buffer): void {
    this.tx.extraPayload = extraPayload;
  }

  static fromTransaction<TNumber extends number | bigint>(
    tx: DashTransaction<TNumber>,
    network?: bitcoinjs.Network,
    prevOutput?: bitcoinjs.TxOutput<TNumber>[]
  ): DashTransactionBuilder<TNumber> {
    const txb = new DashTransactionBuilder<TNumber>(
      tx.network,
      UtxoTransactionBuilder.fromTransaction<TNumber>(tx, network, prevOutput)
    );
    txb.setType(tx.type);
    txb.setExtraPayload(tx.extraPayload);
    return txb;
  }
}
