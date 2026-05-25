import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BitGoBase,
  InvalidAddressError,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';
import { randomBytes } from 'crypto';
import { bip32 } from '@bitgo/utxo-lib';

export interface LightningVerifyAddressOptions extends VerifyAddressOptions {
  walletId: string;
}

export abstract class AbstractLightningCoin extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected readonly network: utxolib.Network;
  protected constructor(bitgo: BitGoBase, network: utxolib.Network, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);
    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }
    this._staticsCoin = staticsCoin;
    this.network = network;
  }

  getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async isWalletAddress(params: LightningVerifyAddressOptions): Promise<boolean> {
    const { address, walletId } = params;

    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    // Node pubkeys are valid addresses but not wallet addresses
    if (/^(02|03)[0-9a-fA-F]{64}$/.test(address)) {
      return false;
    }

    try {
      await this.bitgo.get(this.url(`/wallet/${walletId}/address/${encodeURIComponent(address)}`)).result();
      return true;
    } catch (e) {
      return false;
    }
  }

  parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    throw new Error('Method not implemented.');
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    if (!seed) {
      // An extended private key has both a normal 256 bit private key and a 256
      // bit chain code, both of which must be random. 512 bits is therefore the
      // maximum entropy and gives us maximum security against cracking.
      seed = randomBytes(512 / 8);
    }
    const extendedKey = bip32.fromSeed(seed);
    return {
      pub: extendedKey.neutered().toBase58(),
      prv: extendedKey.toBase58(),
    };
  }

  isValidPub(pub: string): boolean {
    try {
      return bip32.fromBase58(pub).isNeutered();
    } catch (e) {
      return false;
    }
  }

  isValidAddress(address: string): boolean {
    if (/^(02|03)[0-9a-fA-F]{64}$/.test(address)) {
      return true;
    }
    try {
      const script = utxolib.address.toOutputScript(address, this.network);
      return address === utxolib.address.fromOutputScript(script, this.network);
    } catch (e) {
      return false;
    }
  }

  signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  auditDecryptedKey(params: AuditDecryptedKeyParams) {
    /** https://bitgoinc.atlassian.net/browse/BTC-2149 */
    throw new Error('Method not implemented.');
  }
}
