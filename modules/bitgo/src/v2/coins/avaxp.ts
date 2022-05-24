/**
 * @prettier
 */
import * as accountLib from '@bitgo/account-lib';
import { ECPair } from '@bitgo/utxo-lib';
import BigNumber from 'bignumber.js';

import {
  BaseCoin,
  KeyPair,
  SignedTransaction,
  VerifyTransactionOptions,
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionExplanation,
  ParseTransactionOptions,
  ParsedTransaction,
  VerifyAddressOptions as BaseVerifyAddressOptions,
} from '../baseCoin';

import { BitGo } from '../../bitgo';
import { BaseCoin as StaticsBaseCoin, CoinFamily } from '@bitgo/statics';
import { InvalidAddressError, InvalidTransactionError, UnexpectedAddressError } from '../../errors';

interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TransactionPrebuild extends BaseTransactionPrebuild {
  txHex: string;
}

export interface TransactionFee {
  gasLimit: string;
  gasPrice: string;
}

export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
  feeInfo: TransactionFee;
}

interface TransactionOutput {
  address: string;
  amount: string;
  coin: string;
}

interface TransactionOperation {
  type: number;
  amount: string;
  coin: string;
  validator: string;
}

interface VerifyAddressOptions extends BaseVerifyAddressOptions {
  rootAddress: string;
}

export class AvaxP extends BaseCoin {
  verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  isWalletAddress(params: BaseVerifyAddressOptions): boolean {
    throw new Error('Method not implemented.');
  }
  isValidAddress(address: string): boolean {
    throw new Error('Method not implemented.');
  }

  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new AvaxP(bitgo, staticsCoin);
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

  /**
   * Generate Casper key pair - BitGo xpub format
   *
   * @param {Buffer} seed - Seed from which the new keypair should be generated, otherwise a random seed is used
   * @returns {Object} object with generated xpub and xprv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new accountLib.AvaxP.KeyPair({ seed }) : new accountLib.AvaxP.KeyPair();
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
    try {
      return accountLib.AvaxP.Utils.isValidPublicKey(pub);
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
    try {
      return accountLib.AvaxP.Utils.isValidPrivateKey(prv);
    } catch (e) {
      return false;
    }
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param {SignTransactionOptions} params data required to rebuild and sign the transaction
   * @param {TransactionPrebuild} params.txPrebuild prebuild object returned by platform
   * @param {String} params.prv user prv used to sign the transaction
   * @returns Bluebird<SignedTransaction>
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    const txBuilder = accountLib.getBuilder(this.getChain()).from(params.txPrebuild.txHex);
    const key = params.prv;
    txBuilder.sign({ key });

    const transaction: any = await txBuilder.build();
    if (!transaction) {
      throw new InvalidTransactionError('Error while trying to build transaction');
    }
    const response = {
      txHex: transaction.toBroadcastFormat(),
    };
    return transaction.signature.length >= 2 ? response : { halfSigned: response };
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }
}
