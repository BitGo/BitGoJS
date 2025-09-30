import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BitGoBase,
  KeyPair,
  MPCAlgorithm,
  MultisigType,
  multisigTypes,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { auditEddsaPrivateKey } from '@bitgo/sdk-lib-mpc';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';

export class Canton extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Canton(bitgo, staticsCoin);
  }

  /** @inheritDoc */
  public getBaseFactor(): number {
    return 1e10;
  }

  /** @inheritDoc */
  public getChain(): string {
    return 'canton';
  }

  /** @inheritDoc */
  public getFamily(): string {
    return 'canton';
  }

  /** @inheritDoc */
  public getFullName(): string {
    return 'Canton';
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return 'eddsa';
  }

  /** @inheritDoc */
  verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  generateKeyPair(seed?: Buffer): KeyPair {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  isValidPub(pub: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  isValidAddress(address: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  auditDecryptedKey({ multiSigType, prv, publicKey }: AuditDecryptedKeyParams): void {
    if (multiSigType !== 'tss') {
      throw new Error('Unsupported multiSigType');
    }
    auditEddsaPrivateKey(prv, publicKey ?? '');
  }
}
