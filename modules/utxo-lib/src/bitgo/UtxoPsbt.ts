import { UtxoTransaction } from './UtxoTransaction';
import { Psbt, PsbtTransaction } from 'bitcoinjs-lib';
import { Transaction as ITransaction, TransactionFromBuffer } from 'bip174/src/lib/interfaces';
import { Psbt as PsbtBase } from 'bip174';
import { Network } from '..';

interface PsbtOpts {
  network: Network;
}

export class UtxoPsbt<Tx extends UtxoTransaction<bigint>> extends Psbt {
  protected static transactionFromBuffer(buffer: Buffer, network: Network): UtxoTransaction<bigint> {
    return UtxoTransaction.fromBuffer<bigint>(buffer, false, 'bigint', network);
  }

  static createPsbt(opts: PsbtOpts, data: PsbtBase): UtxoPsbt<UtxoTransaction<bigint>> {
    return new UtxoPsbt<UtxoTransaction<bigint>>(
      opts,
      data || new PsbtBase(new PsbtTransaction({ tx: new UtxoTransaction<bigint>(opts.network) }))
    );
  }

  static fromBuffer(buffer: Buffer, opts: PsbtOpts): UtxoPsbt<UtxoTransaction<bigint>> {
    const transactionFromBuffer: TransactionFromBuffer = (buffer: Buffer): ITransaction => {
      const tx = this.transactionFromBuffer(buffer, opts.network);
      return new PsbtTransaction({ tx });
    };
    const psbtBase = PsbtBase.fromBuffer(buffer, transactionFromBuffer);
    const psbt = this.createPsbt(opts, psbtBase);
    // Upstream checks for duplicate inputs here, but it seems to be of dubious value.
    return psbt;
  }

  protected static newTransaction(network: Network): UtxoTransaction<bigint> {
    return new UtxoTransaction<bigint>(network);
  }

  get tx(): Tx {
    return (this.data.globalMap.unsignedTx as PsbtTransaction).tx as Tx;
  }
}
