import { PsbtOpts, UtxoPsbt } from '../UtxoPsbt';
import { Network } from '../../networks';
import { Psbt as PsbtBase } from 'bip174';
import { PsbtTransaction } from 'bitcoinjs-lib';
import { LitecoinTransaction } from './LitecoinTransaction';

export class LitecoinPsbt extends UtxoPsbt<LitecoinTransaction<bigint>> {
  protected static transactionFromBuffer(buffer: Buffer, network: Network): LitecoinTransaction<bigint> {
    return LitecoinTransaction.fromBuffer<bigint>(buffer, false, 'bigint', network);
  }

  static createPsbt(opts: PsbtOpts, data?: PsbtBase): LitecoinPsbt {
    return new LitecoinPsbt(
      opts,
      data || new PsbtBase(new PsbtTransaction({ tx: new LitecoinTransaction<bigint>(opts.network) }))
    );
  }
}
