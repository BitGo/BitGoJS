import { BufferReader, BufferWriter } from 'bitcoinjs-lib/src/bufferutils';
import { crypto as bcrypto } from 'bitcoinjs-lib';

import { UtxoTransaction, varSliceSize } from '../UtxoTransaction';
import { Network } from '../../networkTypes';
import { isDash } from '../../coins';

export class DashTransaction extends UtxoTransaction {
  static DASH_NORMAL = 0;
  static DASH_PROVIDER_REGISTER = 1;
  static DASH_PROVIDER_UPDATE_SERVICE = 2;
  static DASH_PROVIDER_UPDATE_REGISTRAR = 3;
  static DASH_PROVIDER_UPDATE_REVOKE = 4;
  static DASH_COINBASE = 5;
  static DASH_QUORUM_COMMITMENT = 6;

  public type = 0;
  public extraPayload?: Buffer;

  constructor(network: Network, tx?: UtxoTransaction | DashTransaction) {
    super(network, tx);

    if (!isDash(network)) {
      throw new Error(`invalid network`);
    }

    if (tx) {
      this.version = tx.version;

      if (tx instanceof DashTransaction) {
        this.type = tx.type;
        this.extraPayload = tx.extraPayload;
      }
    }
  }

  static fromTransaction(tx: DashTransaction): DashTransaction {
    return new DashTransaction(tx.network, tx);
  }

  static fromBuffer(buffer: Buffer, noStrict: boolean, network: Network): DashTransaction {
    const baseTx = UtxoTransaction.fromBuffer(buffer, true, network);
    const tx = new DashTransaction(network, baseTx);
    tx.version = baseTx.version & 0xffff;
    tx.type = baseTx.version >> 16;
    if (baseTx.byteLength() !== buffer.length) {
      const bufferReader = new BufferReader(buffer, baseTx.byteLength());
      tx.extraPayload = bufferReader.readVarSlice();
    }
    return tx;
  }

  clone(): DashTransaction {
    return new DashTransaction(this.network, this);
  }

  byteLength(_ALLOW_WITNESS?: boolean): number {
    return super.byteLength(_ALLOW_WITNESS) + (this.extraPayload ? varSliceSize(this.extraPayload) : 0);
  }

  toBuffer(buffer?: Buffer, initialOffset?: number): Buffer {
    const buf = Buffer.allocUnsafe(this.byteLength());
    const result = super.toBuffer(buf);
    const bufferWriter = new BufferWriter(result, 0);
    bufferWriter.writeUInt32((this.version & 0xffff) | (this.type << 16));
    if (this.extraPayload) {
      bufferWriter.offset = super.byteLength();
      bufferWriter.writeVarSlice(this.extraPayload);
    }
    return result;
  }

  getHash(forWitness?: boolean): Buffer {
    if (forWitness) {
      throw new Error(`invalid argument`);
    }
    return bcrypto.hash256(this.toBuffer());
  }

  /**
   * Build a hash for all or none of the transaction inputs depending on the hashtype
   * @param hashType
   * @returns Buffer
   */
  getPrevoutHash(hashType: number): Buffer {
    if (!(hashType & UtxoTransaction.SIGHASH_ANYONECANPAY)) {
      const bufferWriter = new BufferWriter(Buffer.allocUnsafe(36 * this.ins.length));

      this.ins.forEach(function (txIn) {
        bufferWriter.writeSlice(txIn.hash);
        bufferWriter.writeUInt32(txIn.index);
      });

      return bcrypto.hash256(bufferWriter.buffer);
    }

    return Buffer.alloc(32, 0);
  }
}
