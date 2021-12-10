import * as bitcoinjs from 'bitcoinjs-lib';
import * as varuint from 'varuint-bitcoin';

import { networks, Network, getMainnet, isBitcoinGold } from '../networks';

export function varSliceSize(slice: Buffer): number {
  const length = slice.length;
  return varuint.encodingLength(length) + length;
}

export class UtxoTransaction extends bitcoinjs.Transaction {
  static SIGHASH_FORKID = 0x40;
  /** @deprecated use SIGHASH_FORKID */
  static SIGHASH_BITCOINCASHBIP143 = UtxoTransaction.SIGHASH_FORKID;

  constructor(public network: Network, transaction: bitcoinjs.Transaction = new bitcoinjs.Transaction()) {
    super();
    this.version = transaction.version;
    this.locktime = transaction.locktime;
    this.ins = transaction.ins.map((v) => ({ ...v }));
    this.outs = transaction.outs.map((v) => ({ ...v }));
  }

  static fromBuffer(
    buf: Buffer,
    noStrict: boolean,
    network?: Network,
    prevOutput?: bitcoinjs.TxOutput[]
  ): UtxoTransaction {
    if (!network) {
      throw new Error(`must provide network`);
    }
    return new UtxoTransaction(network, bitcoinjs.Transaction.fromBuffer(buf, noStrict));
  }

  addForkId(hashType: number): number {
    if (hashType & UtxoTransaction.SIGHASH_FORKID) {
      const forkId = isBitcoinGold(this.network) ? 79 : 0;
      return (hashType | (forkId << 8)) >>> 0;
    }

    return hashType;
  }

  hashForWitnessV0(inIndex: number, prevOutScript: Buffer, value: number, hashType: number): Buffer {
    return super.hashForWitnessV0(inIndex, prevOutScript, value, this.addForkId(hashType));
  }

  /**
   * Calculate the hash to verify the signature against
   */
  hashForSignatureByNetwork(
    inIndex: number,
    prevoutScript: Buffer,
    value: number | undefined,
    hashType: number
  ): Buffer {
    switch (getMainnet(this.network)) {
      case networks.zcash:
        throw new Error(`illegal state`);
      case networks.bitcoincash:
      case networks.bitcoinsv:
      case networks.bitcoingold:
        /*
          Bitcoin Cash supports a FORKID flag. When set, we hash using hashing algorithm
           that is used for segregated witness transactions (defined in BIP143).

          The flag is also used by BitcoinSV and BitcoinGold

          https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/replay-protected-sighash.md
         */
        const addForkId = (hashType & UtxoTransaction.SIGHASH_FORKID) > 0;

        if (addForkId) {
          /*
            ``The sighash type is altered to include a 24-bit fork id in its most significant bits.''
            We also use unsigned right shift operator `>>>` to cast to UInt32
            https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Unsigned_right_shift
           */
          if (value === undefined) {
            throw new Error(`must provide value`);
          }
          return super.hashForWitnessV0(inIndex, prevoutScript, value, this.addForkId(hashType));
        }
    }

    return super.hashForSignature(inIndex, prevoutScript, hashType);
  }

  hashForSignature(inIndex: number, prevOutScript: Buffer, hashType: number): Buffer {
    return this.hashForSignatureByNetwork(inIndex, prevOutScript, (this.ins[inIndex] as any).value, hashType);
  }

  clone(): UtxoTransaction {
    return new UtxoTransaction(this.network, super.clone());
  }
}
