import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BitGoBase,
  InvalidAddressError,
  InvalidTransactionError,
  KeyPair as IKeyPair,
  MethodNotImplementedError,
  MPCAlgorithm,
  MultisigType,
  multisigTypes,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  UnexpectedAddressError,
  VerifyAddressOptions,
} from '@bitgo/sdk-core';
import * as KaspaLib from './lib';
import {
  KaspaExplainTransactionOptions,
  KaspaSignTransactionOptions,
  KaspaVerifyTransactionOptions,
  TransactionExplanation,
} from './lib/iface';
import { isValidKaspaAddress } from './lib/utils';

export class Kaspa extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Kaspa(bitgo, staticsCoin);
  }

  getChain(): string {
    return this._staticsCoin.name;
  }

  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  getFullName(): string {
    return this._staticsCoin.fullName;
  }

  /**
   * Return the base factor (sompi per KASPA).
   * 1 KASPA = 100,000,000 sompi (8 decimal places)
   */
  getBaseFactor(): string | number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /** @inheritDoc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.onchain;
  }

  /**
   * Validate a Kaspa address.
   */
  isValidAddress(address: string): boolean {
    return isValidKaspaAddress(address);
  }

  /**
   * Validate a public key (secp256k1 compressed or uncompressed).
   */
  isValidPub(pub: string): boolean {
    try {
      new KaspaLib.KeyPair({ pub });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate a private key.
   */
  isValidPrv(prv: string): boolean {
    try {
      new KaspaLib.KeyPair({ prv });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate a Kaspa key pair.
   */
  generateKeyPair(seed?: Buffer): IKeyPair {
    const keyPair = seed ? new KaspaLib.KeyPair({ seed }) : new KaspaLib.KeyPair();
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
   * Check if address belongs to wallet by deriving from keychains.
   */
  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    const { address, keychains } = params;

    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    if (!keychains || keychains.length !== 3) {
      throw new Error('Invalid keychains');
    }

    const networkType = this._staticsCoin.network.type;
    const derivedAddress = new KaspaLib.KeyPair({ pub: keychains[0].pub }).getAddress(networkType);

    if (derivedAddress !== address) {
      throw new UnexpectedAddressError(`address validation failure: ${address} is not of this wallet`);
    }

    return true;
  }

  private getBuilder(): KaspaLib.TransactionBuilderFactory {
    return new KaspaLib.TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /**
   * Parse a Kaspa transaction from prebuild.
   */
  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  /**
   * Verify a Kaspa transaction against expected params.
   */
  async verifyTransaction(params: KaspaVerifyTransactionOptions): Promise<boolean> {
    const txHex = params.txPrebuild?.txHex;
    if (!txHex) {
      throw new Error('missing required tx prebuild property txHex');
    }

    let tx: KaspaLib.Transaction;
    try {
      const txBuilder = this.getBuilder().from(txHex);
      tx = (await txBuilder.build()) as KaspaLib.Transaction;
    } catch (error) {
      throw new InvalidTransactionError(`Invalid transaction: ${(error as Error).message}`);
    }

    const explainedTx = tx.explainTransaction();

    if (params.txParams.recipients) {
      const recipientCount = params.txParams.recipients.length;
      if (explainedTx.outputs.length < recipientCount) {
        throw new Error(`Expected at least ${recipientCount} outputs, transaction had ${explainedTx.outputs.length}`);
      }
    }

    return true;
  }

  /**
   * Explain a Kaspa transaction.
   */
  async explainTransaction(params: KaspaExplainTransactionOptions): Promise<TransactionExplanation> {
    const txHex = params.txHex ?? params?.halfSigned?.txHex;
    if (!txHex) {
      throw new Error('missing transaction hex');
    }
    try {
      const txBuilder = this.getBuilder().from(txHex);
      const tx = (await txBuilder.build()) as KaspaLib.Transaction;
      return tx.explainTransaction();
    } catch (e) {
      throw new InvalidTransactionError(`Invalid transaction: ${(e as Error).message}`);
    }
  }

  /**
   * Sign a Kaspa transaction using secp256k1 Schnorr signatures.
   */
  async signTransaction(params: KaspaSignTransactionOptions): Promise<SignedTransaction> {
    const txHex = params.txPrebuild.txHex;
    if (!txHex) {
      throw new InvalidTransactionError('missing txHex in txPrebuild');
    }

    const txBuilder = this.getBuilder().from(txHex);
    const tx = (await txBuilder.build()) as KaspaLib.Transaction;

    if (params.prv) {
      const privKeyHex = params.prv.slice(0, 64);
      const privKeyBuffer = Buffer.from(privKeyHex, 'hex');
      tx.sign(privKeyBuffer);
    }

    const signedHex = tx.toHex();
    const inputCount = tx.txData.inputs.length;
    const sigCount = tx.signature.filter((s) => s.length > 0).length;

    return inputCount > 0 && sigCount >= inputCount ? { txHex: signedHex } : { halfSigned: { txHex: signedHex } };
  }

  async signMessage(key: IKeyPair, message: string | Buffer): Promise<Buffer> {
    throw new MethodNotImplementedError();
  }

  /** @inheritDoc */
  auditDecryptedKey(params: AuditDecryptedKeyParams): void {
    throw new MethodNotImplementedError();
  }

  /**
   * MPC support: Kaspa uses secp256k1 (Schnorr variant).
   */
  supportsTss(): boolean {
    return true;
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }
}
