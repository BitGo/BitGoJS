import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BitGoBase,
  KeyPair,
  ParseTransactionOptions,
  ParsedTransaction,
  SignTransactionOptions,
  SignedTransaction,
  VerifyTransactionOptions,
  MultisigType,
  multisigTypes,
  MPCAlgorithm,
  InvalidAddressError,
  EDDSAMethods,
  TssVerifyAddressOptions,
  MPCType,
} from '@bitgo-beta/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily } from '@bitgo-beta/statics';
import utils from './lib/utils';
import { KeyPair as IotaKeyPair } from './lib';
import { auditEddsaPrivateKey } from '@bitgo-beta/sdk-lib-mpc';

export class Iota extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Iota(bitgo, staticsCoin);
  }

  getBaseFactor(): string | number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  getChain() {
    return this._staticsCoin.name;
  }

  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  getFullName() {
    return this._staticsCoin.fullName;
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
    return MPCType.EDDSA;
  }

  /**
   * Check if an address is valid
   * @param address the address to be validated
   * @returns true if the address is valid
   */
  isValidAddress(address: string): boolean {
    // IOTA addresses are 64-character hex strings
    return utils.isValidAddress(address);
  }

  /**
   * Verifies that a transaction prebuild complies with the original intention
   * @param params
   */
  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    // TODO: Add IOTA-specific transaction verification logic
    return true;
  }

  /**
   * Check if an address belongs to a wallet
   * @param params
   */
  async isWalletAddress(params: TssVerifyAddressOptions): Promise<boolean> {
    const { keychains, address, index } = params;

    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    if (!keychains) {
      throw new Error('missing required param keychains');
    }

    for (const keychain of keychains) {
      const MPC = await EDDSAMethods.getInitializedMpcInstance();
      const commonKeychain = keychain.commonKeychain as string;

      const derivationPath = 'm/' + index;
      const derivedPublicKey = MPC.deriveUnhardened(commonKeychain, derivationPath).slice(0, 64);
      const expectedAddress = utils.getAddressFromPublicKey(derivedPublicKey);

      if (address !== expectedAddress) {
        return false;
      }
    }
    return true;
  }

  /**
   * Parse a transaction
   * @param params
   */
  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    // TODO: Add IOTA-specific transaction parsing logic
    return {};
  }

  /**
   * Generate a key pair
   * @param seed Optional seed to generate key pair from
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new IotaKeyPair({ seed }) : new IotaKeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  /**
   * Check if a public key is valid
   * @param pub Public key to check
   */
  isValidPub(pub: string): boolean {
    return utils.isValidPublicKey(pub);
  }

  /**
   * Sign a transaction
   * @param params
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  /**
   * Audit a decrypted private key to ensure it's valid
   * @param params
   */
  auditDecryptedKey({ multiSigType, prv, publicKey }: AuditDecryptedKeyParams): void {
    if (multiSigType !== multisigTypes.tss) {
      throw new Error('Unsupported multiSigType');
    }
    auditEddsaPrivateKey(prv, publicKey ?? '');
  }
}
