import { PsbtOpts, UtxoPsbt } from '../UtxoPsbt';
import {
  getDefaultConsensusBranchIdForVersion,
  getDefaultVersionGroupIdForVersion,
  ZcashTransaction,
} from './ZcashTransaction';
import { Network, PsbtTransaction, Signer } from '../../';
import { Psbt as PsbtBase } from 'bip174';
import * as types from 'bitcoinjs-lib/src/types';
import { ValidateSigFunction } from 'bitcoinjs-lib/src/psbt';
import { ProprietaryKeySubtype, PSBT_PROPRIETARY_IDENTIFIER, withUnsafeNonSegwit } from '../PsbtUtil';
const typeforce = require('typeforce');

const CONSENSUS_BRANCH_ID_KEY = Buffer.concat([
  Buffer.of(0xfc),
  Buffer.of(0x05),
  Buffer.from(PSBT_PROPRIETARY_IDENTIFIER),
  Buffer.of(ProprietaryKeySubtype.ZEC_CONSENSUS_BRANCH_ID),
]);

export class ZcashPsbt extends UtxoPsbt<ZcashTransaction<bigint>> {
  protected static transactionFromBuffer(buffer: Buffer, network: Network): ZcashTransaction<bigint> {
    return ZcashTransaction.fromBuffer<bigint>(buffer, false, 'bigint', network);
  }

  static createPsbt(opts: PsbtOpts, data?: PsbtBase): ZcashPsbt {
    return new ZcashPsbt(
      opts,
      data || new PsbtBase(new PsbtTransaction({ tx: new ZcashTransaction<bigint>(opts.network) }))
    );
  }

  /**
   * In version < 5 of Zcash transactions, the consensus branch ID is not serialized in the transaction
   * whereas in version 5 it is. If the transaction is less than a version 5, set the consensus branch id
   * in the global map in the psbt. If it is a version 5 transaction, throw an error if the consensus
   * branch id is set in the psbt (because it should be on the transaction already).
   * @param buffer Psbt buffer
   * @param opts options
   */
  static fromBuffer(buffer: Buffer, opts: PsbtOpts): UtxoPsbt<ZcashTransaction<bigint>> {
    const psbt = super.fromBuffer(buffer, opts) as ZcashPsbt;

    // Read `consensusBranchId` from the global-map
    let consensusBranchId: number | undefined = undefined;
    psbt.data.globalMap.unknownKeyVals?.forEach(({ key, value }, i) => {
      if (key.equals(CONSENSUS_BRANCH_ID_KEY)) {
        consensusBranchId = value.readUint32LE();
      }
    });
    switch (psbt.tx.version) {
      case 4:
      case ZcashTransaction.VERSION4_BRANCH_CANOPY:
      case ZcashTransaction.VERSION4_BRANCH_NU5:
        if (!consensusBranchId || !psbt.data.globalMap.unknownKeyVals) {
          throw new Error('Could not find consensus branch id on psbt for version 4 Zcash transaction');
        }
        psbt.tx.consensusBranchId = consensusBranchId;
        psbt.data.globalMap.unknownKeyVals = psbt.data.globalMap.unknownKeyVals.filter(
          ({ key }) => key !== CONSENSUS_BRANCH_ID_KEY
        );

        // Delete consensusBranchId from globalMap so that if we were to serialize the psbt again
        // we would not add a duplicate key into the global map
        psbt.data.globalMap.unknownKeyVals.pop();
        return psbt;
      case 5:
      case ZcashTransaction.VERSION5_BRANCH_NU5:
        if (consensusBranchId) {
          throw new Error('Found consensus branch id in psbt global-map for version 5 Zcash transaction');
        }
        return psbt;
      default:
        throw new Error(`Unsupported transaction version ${psbt.tx.version}`);
    }
  }

  /**
   * If it is a version 4 transaction, add the consensus branch id to
   * the global map. If it is a version 5 transaction, just return the
   * buffer because the consensus branch id is already serialized in
   * the transaction.
   */
  toBuffer(): Buffer {
    if (this.tx.version === 5 || this.tx.version === ZcashTransaction.VERSION5_BRANCH_NU5) {
      return super.toBuffer();
    }
    const value = Buffer.alloc(4);
    value.writeUint32LE(this.tx.consensusBranchId);
    this.addUnknownKeyValToGlobal({ key: CONSENSUS_BRANCH_ID_KEY, value });
    if (!this.data.globalMap.unknownKeyVals) {
      throw new Error('Failed adding consensus branch id to unknownKeyVals');
    }
    const buff = super.toBuffer();
    this.data.globalMap.unknownKeyVals.pop();
    return buff;
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

  // For Zcash transactions, we do not have to have non-witness UTXO data for non-segwit
  // transactions because zcash hashes the value directly. Thus, it is unnecessary to have
  // the previous transaction hash on the unspent.
  signInput(inputIndex: number, keyPair: Signer, sighashTypes?: number[]): this {
    return withUnsafeNonSegwit(this, super.signInput.bind(this, inputIndex, keyPair, sighashTypes));
  }

  validateSignaturesOfInput(inputIndex: number, validator: ValidateSigFunction, pubkey?: Buffer): boolean {
    return withUnsafeNonSegwit(this, super.validateSignaturesOfInput.bind(this, inputIndex, validator, pubkey));
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
