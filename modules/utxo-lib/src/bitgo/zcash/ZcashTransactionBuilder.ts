import { Transaction } from 'bitcoinjs-lib';
import * as types from 'bitcoinjs-lib/src/types';
const typeforce = require('typeforce');

import * as networks from '../../networks';
import { ZcashTransaction } from './ZcashTransaction';
import { Network, ZcashNetwork } from '../../networkTypes';
import { UtxoTransactionBuilder } from '../UtxoTransactionBuilder';
import { toOutputScript } from './address';

export class ZcashTransactionBuilder extends UtxoTransactionBuilder<ZcashTransaction> {
  constructor(network: ZcashNetwork) {
    super(network);
  }

  createInitialTransaction(network: Network, tx?: Transaction): ZcashTransaction {
    return new ZcashTransaction(network as ZcashNetwork, tx as ZcashTransaction);
  }

  static fromTransaction(transaction: ZcashTransaction): ZcashTransactionBuilder {
    const txb = new ZcashTransactionBuilder(transaction.network);

    // Copy transaction fields
    txb.setVersion(transaction.version, !!transaction.overwintered);
    txb.setLockTime(transaction.locktime);

    // Copy Zcash overwinter fields. Omitted if the transaction builder is not for Zcash.
    if (txb.tx.isOverwinterCompatible()) {
      txb.setVersionGroupId(transaction.versionGroupId);
      txb.setExpiryHeight(transaction.expiryHeight);
    }

    txb.setConsensusBranchId(transaction.consensusBranchId);

    // Copy outputs (done first to avoid signature invalidation)
    transaction.outs.forEach(function (txOut) {
      txb.addOutput(txOut.script, txOut.value);
    });

    // Copy inputs
    transaction.ins.forEach(function (txIn) {
      (txb as any).__addInputUnsafe(txIn.hash, txIn.index, {
        sequence: txIn.sequence,
        script: txIn.script,
        witness: txIn.witness,
        value: (txIn as any).value,
      });
    });

    return txb;
  }

  setVersion(version: number, overwinter = true): void {
    typeforce(types.UInt32, version);
    /* istanbul ignore next */
    if (!networks.zcash.consensusBranchId.hasOwnProperty(this.tx.version)) {
      throw new Error('Unsupported Zcash transaction');
    }
    this.tx.overwintered = overwinter ? 1 : 0;
    this.tx.consensusBranchId = networks.zcash.consensusBranchId[version];
    this.tx.version = version;
  }

  setConsensusBranchId(consensusBranchId: number): void {
    typeforce(types.UInt32, consensusBranchId);
    /* istanbul ignore next */
    if (
      !(this as any).__INPUTS.every(function (input: { signatures: unknown }) {
        return input.signatures === undefined;
      })
    ) {
      throw new Error('Changing the consensusBranchId for a partially signed transaction would invalidate signatures');
    }
    this.tx.consensusBranchId = consensusBranchId;
  }

  setVersionGroupId(versionGroupId: number): void {
    typeforce(types.UInt32, versionGroupId);
    (this as any).tx.versionGroupId = versionGroupId;
  }

  setExpiryHeight(expiryHeight: number): void {
    typeforce(types.UInt32, expiryHeight);
    this.tx.expiryHeight = expiryHeight;
  }

  build(): ZcashTransaction {
    return super.build() as ZcashTransaction;
  }

  buildIncomplete(): ZcashTransaction {
    return super.buildIncomplete() as ZcashTransaction;
  }

  addOutput(scriptPubKey: string | Buffer, value: number): number {
    // Attempt to get a script if it's a base58 or bech32 address string
    if (typeof scriptPubKey === 'string') {
      scriptPubKey = toOutputScript(scriptPubKey, this.network as Network);
    }

    return super.addOutput(scriptPubKey, value);
  }
}
