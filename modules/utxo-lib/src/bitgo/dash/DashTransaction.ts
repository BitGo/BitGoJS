import { BufferReader, BufferWriter } from 'bitcoinjs-lib/src/bufferutils';
import { crypto as bcrypto, Transaction } from 'bitcoinjs-lib';

import { UtxoTransaction, varSliceSize } from '../UtxoTransaction';
import { isDash, Network } from '../../networks';

export class DashTransaction<TNumber extends number | bigint = number> extends UtxoTransaction<TNumber> {
  static DASH_NORMAL = 0;
  static DASH_PROVIDER_REGISTER = 1;
  static DASH_PROVIDER_UPDATE_SERVICE = 2;
  static DASH_PROVIDER_UPDATE_REGISTRAR = 3;
  static DASH_PROVIDER_UPDATE_REVOKE = 4;
  static DASH_COINBASE = 5;
  static DASH_QUORUM_COMMITMENT = 6;

  public type = 0;
  public extraPayload?: Buffer;

  constructor(network: Network, tx?: Transaction<bigint | number>, amountType?: 'bigint' | 'number') {
    super(network, tx, amountType);

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

    // since `__toBuffer` is private we have to do a little hack here
    (this as any).__toBuffer = this.toBufferWithExtraPayload;
  }

  protected static newTransaction<TNumber extends number | bigint = number>(
    network: Network,
    transaction?: DashTransaction<number | bigint>,
    amountType?: 'number' | 'bigint'
  ): DashTransaction<TNumber> {
    return new DashTransaction<TNumber>(network, transaction, amountType);
  }

  static fromBuffer<TNumber extends number | bigint = number>(
    buffer: Buffer,
    noStrict: boolean,
    amountType: 'number' | 'bigint' = 'number',
    network: Network
  ): DashTransaction<TNumber> {
    const tx = new DashTransaction<TNumber>(network, super.fromBuffer<TNumber>(buffer, true, amountType, network));
    tx.type = tx.version >> 16;
    tx.version = tx.version & 0xffff;
    if (tx.byteLength() !== buffer.length) {
      const bufferReader = new BufferReader(buffer, tx.byteLength());
      tx.extraPayload = bufferReader.readVarSlice();
    }
    return tx;
  }

  clone<TN2 extends bigint | number = TNumber>(amountType?: 'number' | 'bigint'): DashTransaction<TN2> {
    return new DashTransaction<TN2>(this.network, this, amountType);
  }

  byteLength(_ALLOW_WITNESS?: boolean): number {
    return super.byteLength(_ALLOW_WITNESS) + (this.extraPayload ? varSliceSize(this.extraPayload) : 0);
  }

  /**
   * Helper to override `__toBuffer()` of bitcoinjs.Transaction.
   * Since the method is private, we use a hack in the constructor to make it work.
   *
   * TODO: remove `private` modifier in bitcoinjs `__toBuffer()` or find some other solution
   *
   * @param buffer - optional target buffer
   * @param initialOffset - can only be undefined or 0. Other values are only used for serialization in blocks.
   * @param _ALLOW_WITNESS - ignored
   */
  private toBufferWithExtraPayload(buffer?: Buffer, initialOffset?: number, _ALLOW_WITNESS = false): Buffer {
    // We can ignore the `_ALLOW_WITNESS` parameter here since it has no effect.
    if (!buffer) {
      buffer = Buffer.allocUnsafe(this.byteLength(false));
    }

    if (initialOffset !== undefined && initialOffset !== 0) {
      throw new Error(`not supported`);
    }

    // Start out with regular bitcoin byte sequence.
    // This buffer will have excess size because it uses `byteLength()` to allocate.
    const baseBuffer = (Transaction.prototype as any).__toBuffer.call(this);
    baseBuffer.copy(buffer);

    // overwrite leading version bytes (uint16 version, uint16 type)
    const bufferWriter = new BufferWriter(buffer, 0);
    bufferWriter.writeUInt32((this.version & 0xffff) | (this.type << 16));

    // Seek to end of original byte sequence and add extraPayload.
    // We must use the byteLength as calculated by the bitcoinjs implementation since
    // `baseBuffer` has an excess size.
    if (this.extraPayload) {
      bufferWriter.offset = Transaction.prototype.byteLength.call(this);
      bufferWriter.writeVarSlice(this.extraPayload);
    }

    return buffer;
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
