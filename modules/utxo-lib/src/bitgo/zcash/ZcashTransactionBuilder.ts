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

export class ZcashTransactionBuilder<TNumber extends number | bigint = number> extends UtxoTransactionBuilder<
  TNumber,
  ZcashTransaction<TNumber>
> {
  constructor(network: ZcashNetwork) {
    super(network);
  }

  protected createInitialTransaction(network: Network): ZcashTransaction<TNumber> {
    return new ZcashTransaction<TNumber>(network as ZcashNetwork);
  }

  static fromTransaction<TNumber extends number | bigint = number>(
    transaction: ZcashTransaction<TNumber>,
    network?: Network,
    prevOutput?: bitcoinjs.TxOutput<TNumber>[]
  ): ZcashTransactionBuilder<TNumber> {
    const txb = new ZcashTransactionBuilder<TNumber>(transaction.network);

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

  setDefaultsForVersion(network: Network, version: number): void {
    switch (version) {
      case 4:
      case ZcashTransaction.VERSION4_BRANCH_CANOPY:
      case ZcashTransaction.VERSION4_BRANCH_NU5:
        this.setVersion(4);
        break;
      case 5:
      case ZcashTransaction.VERSION5_BRANCH_NU5:
        this.setVersion(5);
        break;
      default:
        throw new Error(`invalid version ${version}`);
    }

    this.tx.versionGroupId = getDefaultVersionGroupIdForVersion(version);
    this.tx.consensusBranchId = getDefaultConsensusBranchIdForVersion(network, version);
  }

  private hasSignatures(): boolean {
    return (this as any).__INPUTS.some(function (input: { signatures: unknown }) {
      return input.signatures !== undefined;
    });
  }

  private setPropertyCheckSignatures(propName: keyof ZcashTransaction<TNumber>, value: unknown) {
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

  build(): ZcashTransaction<TNumber> {
    return super.build() as ZcashTransaction<TNumber>;
  }

  buildIncomplete(): ZcashTransaction<TNumber> {
    return super.buildIncomplete() as ZcashTransaction<TNumber>;
  }

  addOutput(scriptPubKey: string | Buffer, value: TNumber): number {
    // Attempt to get a script if it's a base58 or bech32 address string
    if (typeof scriptPubKey === 'string') {
      scriptPubKey = toOutputScript(scriptPubKey, this.network as Network);
    }

    return super.addOutput(scriptPubKey, value);
  }
}
