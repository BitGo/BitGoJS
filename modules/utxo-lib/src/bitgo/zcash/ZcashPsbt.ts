import { PsbtOpts, UtxoPsbt } from '../UtxoPsbt';
import {
  getDefaultConsensusBranchIdForVersion,
  getDefaultVersionGroupIdForVersion,
  ZcashTransaction,
} from './ZcashTransaction';
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

  private setPropertyCheckSignatures(propName: keyof ZcashTransaction<bigint>, value: unknown) {
    if (this.tx[propName] === value) {
      return;
    }
    this.checkForSignatures(propName);
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
}
