/**
 * @prettier
 */
import { UtxoTransactionBuilder } from '../UtxoTransactionBuilder';
import { Network } from '../../networkTypes';
import { DashTransaction } from './DashTransaction';
import { Transaction } from 'bitcoinjs-lib';
import { UtxoTransaction } from '../UtxoTransaction';

export class DashTransactionBuilder extends UtxoTransactionBuilder<DashTransaction> {
  constructor(network: Network, txb?: UtxoTransactionBuilder) {
    super(network, txb);
  }

  createInitialTransaction(network: Network, tx?: Transaction): DashTransaction {
    return new DashTransaction(network, tx as UtxoTransaction);
  }

  setType(type: number) {
    this.tx.type = type;
  }

  setExtraPayload(extraPayload?: Buffer) {
    this.tx.extraPayload = extraPayload;
  }

  static fromTransaction(tx: DashTransaction): DashTransactionBuilder {
    const txb = new DashTransactionBuilder(tx.network, UtxoTransactionBuilder.fromTransaction(tx));
    txb.setType(tx.type);
    txb.setExtraPayload(tx.extraPayload);
    return txb;
  }
}
