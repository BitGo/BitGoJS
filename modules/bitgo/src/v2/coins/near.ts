/**
 * @prettier
 */

import BigNumber from 'bignumber.js';
import * as accountLib from '@bitgo/account-lib';
import * as _ from 'lodash';
import { BitGo } from '../../bitgo';
import { MethodNotImplementedError } from '../../errors';
import {
  BaseCoin,
  KeyPair,
  ParsedTransaction as BaseParsedTransaction,
  ParseTransactionOptions as BaseParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionExplanation,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '../baseCoin';
import * as base58 from 'bs58';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import { BaseTransaction } from '@bitgo/sdk-core';

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TransactionPrebuild {
  txHex: string;
  key: string;
  blockHash: string;
  nonce: number;
}

export interface ExplainTransactionOptions {
  txPrebuild: TransactionPrebuild;
  publicKey: string;
  feeInfo: {
    fee: string;
  };
}

export interface VerifiedTransactionParameters {
  txHex: string;
  prv: string;
  signer: string;
}

export interface NearParseTransactionOptions extends BaseParseTransactionOptions {
  txPrebuild: TransactionPrebuild;
  publicKey: string;
  feeInfo: {
    fee: string;
  };
}

interface TransactionOutput {
  address: string;
  amount: string;
}

type TransactionInput = TransactionOutput;

export interface NearParsedTransaction extends BaseParsedTransaction {
  // total assets being moved, including fees
  inputs: TransactionInput[];

  // where assets are moved to
  outputs: TransactionOutput[];
}

export type NearTransactionExplanation = TransactionExplanation;

const nearUtils = accountLib.Near.Utils.default;

export class Near extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Near(bitgo, staticsCoin);
  }

  allowsAccountConsolidations(): boolean {
    return true;
  }

  /**
   * Flag indicating if this coin supports TSS wallets.
   * @returns {boolean} True if TSS Wallets can be created for this coin
   */
  supportsTss(): boolean {
    return true;
  }

  getChain(): string {
    return this._staticsCoin.name;
  }

  getBaseChain(): string {
    return this.getChain();
  }

  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  getFullName(): string {
    return this._staticsCoin.fullName;
  }

  getBaseFactor(): any {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return false;
  }

  /**
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new accountLib.Near.KeyPair({ seed }) : new accountLib.Near.KeyPair();
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
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub: string): boolean {
    return nearUtils.isValidPublicKey(pub);
  }

  /**
   * Return boolean indicating whether the supplied private key is a valid near private key
   *
   * @param {String} prv the prv to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPrv(prv: string): boolean {
    return nearUtils.isValidPrivateKey(prv);
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {String} address the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidAddress(address: string): boolean {
    return nearUtils.isValidAddress(address);
  }

  /** @inheritDoc */
  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const nearKeypair = new accountLib.Near.KeyPair({ prv: key.prv });
    if (Buffer.isBuffer(message)) {
      message = base58.encode(message);
    }

    return Buffer.from(nearKeypair.signMessage(message));
  }

  /**
   * Explain/parse transaction
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<NearTransactionExplanation> {
    const factory = accountLib.register(this.getChain(), accountLib.Near.TransactionBuilderFactory);
    let rebuiltTransaction: BaseTransaction;
    const txRaw = params.txPrebuild.txHex;

    try {
      const transactionBuilder = factory.from(txRaw);
      rebuiltTransaction = await transactionBuilder.build();
    } catch {
      throw new Error('Invalid transaction');
    }

    return rebuiltTransaction.explainTransaction();
  }

  verifySignTransactionParams(params: SignTransactionOptions): VerifiedTransactionParameters {
    const prv = params.prv;

    const txHex = params.txPrebuild.txHex;

    if (_.isUndefined(txHex)) {
      throw new Error('missing txPrebuild parameter');
    }

    if (!_.isString(txHex)) {
      throw new Error(`txPrebuild must be an object, got type ${typeof txHex}`);
    }

    if (_.isUndefined(prv)) {
      throw new Error('missing prv parameter to sign transaction');
    }

    if (!_.isString(prv)) {
      throw new Error(`prv must be a string, got type ${typeof prv}`);
    }

    if (!_.has(params.txPrebuild, 'key')) {
      throw new Error('missing public key parameter to sign transaction');
    }

    // if we are receiving addresses do not try to convert them
    const signer = !nearUtils.isValidAddress(params.txPrebuild.key)
      ? new accountLib.Near.KeyPair({ pub: params.txPrebuild.key }).getAddress()
      : params.txPrebuild.key;
    return { txHex, prv, signer };
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {TransactionPrebuild} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @param callback
   * @returns {Bluebird<SignedTransaction>}
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    const factory = accountLib.register(this.getChain(), accountLib.Near.TransactionBuilderFactory);
    const txBuilder = factory.from(params.txPrebuild.txHex);
    txBuilder.sign({ key: params.prv });
    const transaction: BaseTransaction = await txBuilder.build();

    if (!transaction) {
      throw new Error('Invalid transaction');
    }

    const serializedTx = (transaction as BaseTransaction).toBroadcastFormat();

    return {
      txHex: serializedTx,
    } as any;
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   */
  async recover(params: any): Promise<any> {
    throw new MethodNotImplementedError('Near recovery not implemented');
  }

  async parseTransaction(params: NearParseTransactionOptions): Promise<NearParsedTransaction> {
    const transactionExplanation = await this.explainTransaction({
      txPrebuild: params.txPrebuild,
      publicKey: params.publicKey,
      feeInfo: params.feeInfo,
    });

    if (!transactionExplanation) {
      throw new Error('Invalid transaction');
    }

    const nearTransaction = transactionExplanation as NearTransactionExplanation;
    if (nearTransaction.outputs.length <= 0) {
      return {
        inputs: [],
        outputs: [],
      };
    }

    const senderAddress = nearTransaction.outputs[0].address;
    const feeAmount = new BigNumber(nearTransaction.fee.fee === '' ? '0' : nearTransaction.fee.fee);

    // assume 1 sender, who is also the fee payer
    const inputs = [
      {
        address: senderAddress,
        amount: new BigNumber(nearTransaction.outputAmount).plus(feeAmount).toFixed(),
      },
    ];

    const outputs: TransactionOutput[] = nearTransaction.outputs.map((output) => {
      return {
        address: output.address,
        amount: new BigNumber(output.amount).toFixed(),
      };
    });

    return {
      inputs,
      outputs,
    };
  }

  isWalletAddress(params: VerifyAddressOptions): boolean {
    throw new MethodNotImplementedError();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    let totalAmount = new BigNumber(0);
    const coinConfig = coins.get(this.getChain());
    const { txPrebuild: txPrebuild, txParams: txParams } = params;
    const transaction = new accountLib.Near.Transaction(coinConfig);
    const rawTx = txPrebuild.txHex;
    if (!rawTx) {
      throw new Error('missing required tx prebuild property txHex');
    }

    transaction.fromRawTransaction(rawTx);
    const explainedTx = transaction.explainTransaction();

    // users do not input recipients for consolidation requests as they are generated by the server
    if (txParams.recipients !== undefined) {
      const filteredRecipients = txParams.recipients?.map((recipient) => _.pick(recipient, ['address', 'amount']));
      const filteredOutputs = explainedTx.outputs.map((output) => _.pick(output, ['address', 'amount']));

      if (!_.isEqual(filteredOutputs, filteredRecipients)) {
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }
      for (const recipients of txParams.recipients) {
        totalAmount = totalAmount.plus(recipients.amount);
      }
      if (!totalAmount.isEqualTo(explainedTx.outputAmount)) {
        throw new Error('Tx total amount does not match with expected total amount field');
      }
    }
    return true;
  }
}
