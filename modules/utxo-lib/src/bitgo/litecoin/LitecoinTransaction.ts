import { BufferReader, BufferWriter } from 'bitcoinjs-lib/src/bufferutils';

import { UtxoTransaction } from '../UtxoTransaction';
import { isLitecoin, Network, networks } from '../../networks';

export type LitecoinNetwork = typeof networks.litecoin | typeof networks.litecoinTest;

/**
 * We only care about reading a transaction that can have a potentially different advanced transaction flag,
 * but we dont need to write one.
 */
export class LitecoinTransaction<TNumber extends number | bigint = number> extends UtxoTransaction<TNumber> {
  static MWEB_PEGOUT_TX_FLAG = 0x08;

  constructor(network: Network, tx?: LitecoinTransaction<bigint | number>, amountType?: 'bigint' | 'number') {
    super(network, tx, amountType);

    if (!isLitecoin(network)) {
      throw new Error(`invalid network`);
    }
  }

  protected static newTransaction<TNumber extends number | bigint = number>(
    network: Network,
    transaction?: LitecoinTransaction<number | bigint>,
    amountType?: 'number' | 'bigint'
  ): LitecoinTransaction<TNumber> {
    return new LitecoinTransaction<TNumber>(network, transaction, amountType);
  }

  clone<TN2 extends bigint | number = TNumber>(amountType?: 'number' | 'bigint'): LitecoinTransaction<TN2> {
    return new LitecoinTransaction<TN2>(this.network, this, amountType);
  }

  static fromBuffer<TNumber extends number | bigint = number>(
    buffer: Buffer,
    noStrict: boolean,
    amountType: 'number' | 'bigint' = 'number',
    network?: LitecoinNetwork
  ): LitecoinTransaction<TNumber> {
    if (!network) {
      throw new Error(`must provide network`);
    }

    const bufferReader = new BufferReader(buffer);
    const txVersion = bufferReader.readInt32();
    const marker = bufferReader.readUInt8();
    const flag = bufferReader.readUInt8();

    if (
      marker === LitecoinTransaction.ADVANCED_TRANSACTION_MARKER &&
      flag === LitecoinTransaction.MWEB_PEGOUT_TX_FLAG
    ) {
      // Litecoin has an MWEB advanced transaction marker. Slice out the marker and 5th to last byte  and read like a normal transaction
      const bufferWriter = new BufferWriter(Buffer.allocUnsafe(buffer.length - 3));
      bufferWriter.writeUInt32(txVersion);
      bufferWriter.writeSlice(buffer.slice(6, buffer.length - 5));
      bufferWriter.writeSlice(buffer.slice(buffer.length - 4, buffer.length));
      return super.fromBuffer(bufferWriter.buffer, noStrict, amountType, network);
    }
    return super.fromBuffer(buffer, noStrict, amountType, network);
  }
}
