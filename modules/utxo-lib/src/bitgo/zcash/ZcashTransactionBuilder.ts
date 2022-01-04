import * as bitcoinjs from 'bitcoinjs-lib';
import * as types from 'bitcoinjs-lib/src/types';
const typeforce = require('typeforce');

import { Network } from '../..';
import {
  getDefaultConsensusBranchIdForVersion,
  getDefaultVersionGroupIdForVersion,
  ZcashNetwork,
  ZcashTransaction,
} from './ZcashTransaction';
import { UtxoTransactionBuilder } from '../UtxoTransactionBuilder';
import { toOutputScript } from './address';

export class ZcashTransactionBuilder extends UtxoTransactionBuilder<ZcashTransaction> {
  constructor(network: ZcashNetwork) {
    super(network);
  }

  createInitialTransaction(network: Network, tx?: bitcoinjs.Transaction): ZcashTransaction {
    return new ZcashTransaction(network as ZcashNetwork, tx as ZcashTransaction);
  }

  static fromTransaction(
    transaction: ZcashTransaction,
    network?: bitcoinjs.Network,
    prevOutput?: bitcoinjs.TxOutput[]
  ): ZcashTransactionBuilder {
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
    this.tx.overwintered = overwinter ? 1 : 0;
    this.tx.version = version;
  }

  setDefaultsForVersion(version: number): void {
    if (version !== 4 && version !== 5) {
      throw new Error(`invalid version`);
    }
    this.setVersion(version);
    this.tx.versionGroupId = getDefaultVersionGroupIdForVersion(version);
    this.tx.consensusBranchId = getDefaultConsensusBranchIdForVersion(version);
  }

  private hasSignatures(): boolean {
    return (this as any).__INPUTS.some(function (input: { signatures: unknown }) {
      return input.signatures !== undefined;
    });
  }

  private setPropertyCheckSignatures(propName: keyof ZcashTransaction, value: unknown) {
    if (this.tx[propName] === value) {
      return;
    }
    if (this.hasSignatures()) {
      throw new Error(`Changing property ${propName} for a partially signed transaction would invalidate signatures`);
    }
    this.tx[propName] = value as any;
  }

  setConsensusBranchId(consensusBranchId: number): void {
    typeforce(types.UInt32, consensusBranchId);
    this.setPropertyCheckSignatures('consensusBranchId', consensusBranchId);
  }

  setVersionGroupId(versionGroupId: number): void {
    typeforce(types.UInt32, versionGroupId);
    this.setPropertyCheckSignatures('versionGroupId', versionGroupId);
  }

  setExpiryHeight(expiryHeight: number): void {
    typeforce(types.UInt32, expiryHeight);
    this.setPropertyCheckSignatures('expiryHeight', expiryHeight);
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
