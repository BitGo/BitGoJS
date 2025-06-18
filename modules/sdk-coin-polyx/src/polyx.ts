import { AuditDecryptedKeyParams, BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { SubstrateCoin } from '@bitgo/abstract-substrate';
import { BatchStakingBuilder } from './lib/batchStakingBuilder';
import { BondExtraBuilder } from './lib/bondExtraBuilder';
import { POLYX_ADDRESS_FORMAT } from './lib/constants';

export class Polyx extends SubstrateCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Polyx(bitgo, staticsCoin);
  }

  /**
   * Factor between the coin's base unit and its smallest subdivison
   */
  public getBaseFactor(): number {
    return 1e6;
  }

  public getChain(): string {
    return 'polyx';
  }

  public getFullName(): string {
    return 'Polymesh';
  }

  /** @inheritDoc */
  auditDecryptedKey({ publicKey, prv, multiSigType }: AuditDecryptedKeyParams) {
    super.auditDecryptedKey({ publicKey, prv, multiSigType });
  }

  stakingBatch(): BatchStakingBuilder {
    return this.getBuilder().getBatchBuilder();
  }

  bondExtra(): BondExtraBuilder {
    return this.getBuilder().getBondExtraBuilder();
  }

  /**
   * Retrieves the address format for Polyx.
   *
   * @returns {number} The address format as a number for Polyx.
   * @override
   */
  protected getAddressFormat(): number {
    return POLYX_ADDRESS_FORMAT;
  }
}
