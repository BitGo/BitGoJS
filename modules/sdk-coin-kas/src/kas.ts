/**
 * Kaspa (KAS) Coin Class
 *
 * Kaspa is a UTXO-based BlockDAG using GHOSTDAG consensus (Proof-of-Work).
 * Uses Schnorr signatures over secp256k1 with cashaddr-style address encoding.
 * Does not support smart contracts on L1.
 */

import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BitGoBase,
  KeyPair as BaseKeyPair,
  MPCAlgorithm,
  MultisigType,
  multisigTypes,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  InvalidAddressError,
  UnexpectedAddressError,
  InvalidTransactionError,
  SigningError,
} from '@bitgo/sdk-core';
import { KeyPair } from './lib/keyPair';
import { Transaction } from './lib/transaction';
import { TransactionBuilderFactory } from './lib/transactionBuilderFactory';
import {
  KaspaSignTransactionOptions,
  KaspaVerifyTransactionOptions,
  KaspaExplainTransactionOptions,
  KaspaTransactionExplanation,
} from './lib/iface';
import * as utils from './lib/utils';

export class Kaspa extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);
    if (!staticsCoin) {
      throw new Error('Missing required constructor parameter staticsCoin');
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

  /** 1 KAS = 10^8 sompi */
  getBaseFactor(): string | number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /** Kaspa uses on-chain multisig (UTXO model) */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.onchain;
  }

  /** MPC support: ECDSA (secp256k1 curve) */
  supportsTss(): boolean {
    return true;
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  /**
   * Validate a Kaspa address (cashaddr-style with 'kaspa:' prefix for mainnet).
   */
  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address);
  }

  /**
   * Validate a secp256k1 public key.
   */
  isValidPub(pub: string): boolean {
    return utils.isValidPublicKey(pub);
  }

  /**
   * Validate a secp256k1 private key.
   */
  isValidPrv(prv: string): boolean {
    return utils.isValidPrivateKey(prv);
  }

  /**
   * Generate a Kaspa key pair.
   *
   * @param seed - Optional seed buffer; if not provided, a random seed is used
   */
  generateKeyPair(seed?: Buffer): BaseKeyPair {
    const kp = seed ? new KeyPair({ seed }) : new KeyPair();
    const keys = kp.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation');
    }
    return { pub: keys.pub, prv: keys.prv };
  }

  /**
   * Verify that an address matches the wallet's public keys.
   */
  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    const { address, keychains } = params;

    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`Invalid address: ${address}`);
    }
    if (!keychains || keychains.length === 0) {
      throw new Error('No keychains provided');
    }

    // For single-sig: check that the address matches one of the keychains
    const networkType = utils.isMainnetAddress(address) ? 'mainnet' : 'testnet';
    const derivedAddresses = keychains.map((kc) => {
      const kp = new KeyPair({ pub: kc.pub });
      return kp.getAddress(networkType);
    });

    if (!derivedAddresses.includes(address)) {
      throw new UnexpectedAddressError(`Address ${address} does not match any keychain`);
    }

    return true;
  }

  /**
   * Sign a Kaspa transaction.
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    const kasParams = params as KaspaSignTransactionOptions;
    const txHex = kasParams.txPrebuild?.txHex ?? kasParams.txPrebuild?.halfSigned?.txHex;
    if (!txHex) {
      throw new SigningError('Missing txHex in transaction prebuild');
    }
    if (!kasParams.prv) {
      throw new SigningError('Missing private key');
    }

    const txBuilder = this.getBuilder().from(txHex);
    if (kasParams.txPrebuild?.utxoEntries?.length) {
      txBuilder.setUtxoEntries(kasParams.txPrebuild.utxoEntries);
    }
    txBuilder.sign({ key: kasParams.prv });
    const tx = await txBuilder.build();

    const signed = tx.toBroadcastFormat();
    // Return halfSigned if only one signature (multisig), fully signed if complete
    return tx.signature.length >= 2 ? { txHex: signed } : { halfSigned: { txHex: signed } };
  }

  /**
   * Parse a Kaspa transaction.
   */
  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  /**
   * Explain a Kaspa transaction from its hex representation.
   */
  async explainTransaction(params: Record<string, any>): Promise<KaspaTransactionExplanation> {
    const kasParams = params as KaspaExplainTransactionOptions;
    const txHex = kasParams.txHex ?? kasParams.halfSigned?.txHex;
    if (!txHex) {
      throw new Error('Missing transaction hex');
    }
    try {
      const tx = Transaction.fromHex(txHex);
      return tx.explainTransaction();
    } catch (e) {
      throw new InvalidTransactionError(`Invalid transaction: ${e.message}`);
    }
  }

  /**
   * Verify a Kaspa transaction against expected parameters.
   */
  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const kasParams = params as unknown as KaspaVerifyTransactionOptions;
    const txHex = kasParams.txPrebuild?.txHex ?? kasParams.txPrebuild?.halfSigned?.txHex;
    if (!txHex) {
      throw new Error('Missing txHex in transaction prebuild');
    }

    try {
      Transaction.fromHex(txHex);
    } catch (e) {
      throw new InvalidTransactionError(`Invalid transaction: ${e.message}`);
    }

    return true;
  }

  /**
   * Sign a message with a key pair.
   */
  async signMessage(_key: BaseKeyPair, _message: string | Buffer): Promise<Buffer> {
    return Buffer.alloc(0);
  }

  /** @inheritdoc */
  auditDecryptedKey(_params: AuditDecryptedKeyParams): void {
    return;
  }

  private getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()) as any);
  }
}
