/**
 * @prettier
 */
import * as Bluebird from 'bluebird';
import * as accountLib from '@bitgo/account-lib';
import { ECPair } from '@bitgo/utxo-lib';
import { BaseCoin, KeyPair, SignedTransaction, VerifyAddressOptions, VerifyTransactionOptions } from '../baseCoin';
import { NodeCallback } from '../types';
import { BitGo } from '../../bitgo';
import { BaseCoin as StaticsBaseCoin, CoinFamily } from '@bitgo/statics';

const co = Bluebird.coroutine;

interface SupplementGenerateWalletOptions {
  rootPrivateKey?: string;
}

export class Cspr extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Cspr(bitgo, staticsCoin);
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
  getBaseFactor(): string | number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  verifyTransaction(params: VerifyTransactionOptions, callback?: NodeCallback<boolean>): Bluebird<boolean> {
    // TODO: Implement when available on the SDK.
    return Bluebird.resolve(true).asCallback(callback);
  }
  verifyAddress(params: VerifyAddressOptions): boolean {
    // TODO: Implement when available on the SDK.
    throw true;
  }

  /**
   * Generate Casper key pair - BitGo xpub format
   *
   * @param {Buffer} seed - Seed from which the new keypair should be generated, otherwise a random seed is used
   * @returns {Object} object with generated xpub and xprv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new accountLib.Cspr.KeyPair({ seed }) : new accountLib.Cspr.KeyPair();
    const keys = keyPair.getExtendedKeys();

    if (!keys.xprv) {
      throw new Error('Missing xprv in key generation.');
    }

    return {
      pub: keys.xpub,
      prv: keys.xprv,
    };
  }

  isValidPub(pub: string): boolean {
    // TODO(STLX-1344): Validate using account-lib when available
    //  return accountLib.Cspr.Utils.isValidPublicKey(pub);
    try {
      new accountLib.Cspr.KeyPair({ pub });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Return boolean indicating whether input is valid private key for the coin
   *
   * @param prv the prv to be checked
   * @returns is it valid?
   */
  isValidPrv(prv: string): boolean {
    // TODO(STLX-1345): Validate using account-lib when available
    //  return accountLib.Cspr.Utils.isValidPrivateKey(prv);
    try {
      new accountLib.Cspr.KeyPair({ prv });
      return true;
    } catch (e) {
      return false;
    }
  }

  isValidAddress(address: string): boolean {
    throw new Error('Method not implemented.');
  }
  signTransaction(paraCeloAccountLibms: any): Bluebird<SignedTransaction> {
    throw new Error('Method not implemented.');
  }
  parseTransaction(params: any, callback?: NodeCallback<any>): Bluebird<any> {
    throw new Error('Method not implemented.');
  }

  /**
   * Extend walletParams with extra params required for generating a Casper wallet
   *
   * Casper wallets have three three keys, user, backup and bitgo.
   * Initially, we need a root prv to generate the account, which must be distinct from all three keychains on the wallet.
   * If a root private key is not provided, a random one is generated.
   * The root public key is the basis for the wallet root address.
   */
  supplementGenerateWallet(walletParams: SupplementGenerateWalletOptions): Bluebird<SupplementGenerateWalletOptions> {
    const self = this;
    return co<SupplementGenerateWalletOptions>(function*() {
      if (walletParams.rootPrivateKey) {
        if (!self.isValidPrv(walletParams.rootPrivateKey) || walletParams.rootPrivateKey.length !== 64) {
          throw new Error('rootPrivateKey needs to be a hexadecimal private key string');
        }
      } else {
        const keyPair = ECPair.makeRandom();
        walletParams.rootPrivateKey = keyPair.getPrivateKeyBuffer().toString('hex');
      }
      return walletParams;
    }).call(this);
  }
}
