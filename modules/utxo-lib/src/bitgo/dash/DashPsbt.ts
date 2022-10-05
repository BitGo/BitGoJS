import { DashTransaction } from './DashTransaction';
import { PsbtOpts, UtxoPsbt } from '../UtxoPsbt';
import { Network } from '../../networks';
import { Psbt as PsbtBase } from 'bip174';
import { PsbtTransaction } from 'bitcoinjs-lib';

export class DashPsbt extends UtxoPsbt<DashTransaction<bigint>> {
  protected static transactionFromBuffer(buffer: Buffer, network: Network): DashTransaction<bigint> {
    return DashTransaction.fromBuffer<bigint>(buffer, false, 'bigint', network);
  }

  static createPsbt(opts: PsbtOpts, data?: PsbtBase): DashPsbt {
    return new DashPsbt(
      opts,
      data || new PsbtBase(new PsbtTransaction({ tx: new DashTransaction<bigint>(opts.network) }))
    );
  }

  setType(type: number): DashPsbt {
    this.checkForSignatures('type');
    this.tx.type = type;
    return this;
  }

  setExtraPayload(extraPayload?: Buffer): DashPsbt {
    this.checkForSignatures('extraPayload');
    this.tx.extraPayload = extraPayload;
    return this;
  }
}
