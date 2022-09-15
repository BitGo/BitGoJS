import { PsbtOpts, UtxoPsbt } from '../UtxoPsbt';
import { ZcashTransaction } from './ZcashTransaction';
import { Network, PsbtTransaction } from '../../';
import { Psbt as PsbtBase } from 'bip174';
import * as types from 'bitcoinjs-lib/src/types';

const typeforce = require('typeforce');

export class ZcashPsbt extends UtxoPsbt<ZcashTransaction<bigint>> {
  protected static transactionFromBuffer(buffer: Buffer, network: Network): ZcashTransaction<bigint> {
    return ZcashTransaction.fromBuffer<bigint>(buffer, false, 'bigint', network);
  }

  static createPsbt(opts: PsbtOpts, data: PsbtBase): ZcashPsbt {
    return new ZcashPsbt(
      opts,
      data || new PsbtBase(new PsbtTransaction({ tx: new ZcashTransaction<bigint>(opts.network) }))
    );
  }

  setVersion(version: number, overwinter = true): this {
    typeforce(types.UInt32, version);
    this.tx.overwintered = overwinter ? 1 : 0;
    this.tx.version = version;
    return this;
  }
}
