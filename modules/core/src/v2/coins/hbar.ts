/**
 * @prettier
 */
import * as Bluebird from 'bluebird';
import { CoinFamily, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
const co = Bluebird.coroutine;
import * as bitgoAccountLib from '@bitgo/account-lib';

import {
  BaseCoin,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  TransactionFee,
  TransactionRecipient as Recipient,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionExplanation,
} from '../baseCoin';

import { BitGo } from '../../bitgo';
import { NodeCallback } from '../types';
import { InvalidAddressError, InvalidMemoIdError, MethodNotImplementedError } from '../../errors';
import * as stellar from 'stellar-sdk';
import { SeedValidator } from '../internal/seedValidator';

export interface HbarSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TxInfo {
  recipients: Recipient[];
  from: string;
  txid: string;
}

export interface TransactionPrebuild extends BaseTransactionPrebuild {
  txHex: string;
  txInfo: TxInfo;
  feeInfo: TransactionFee;
  source: string;
}

export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
  feeInfo: TransactionFee;
  // TODO(BG-24809): get the memo from the toJson
  memo?: {
    type: string;
    value: string;
  };
}

interface AddressDetails {
  address: string;
  memoId?: string;
}

export class Hbar extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
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

  getBaseFactor() {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Hbar(bitgo, staticsCoin);
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return false;
  }

  /**
   * Checks if this is a valid base58 or hex address
   * @param address
   */
  isValidAddress(address: string): boolean {
    try {
      const addressDetails = this.getAddressDetails(address);
      if (typeof addressDetails.memoId === 'undefined' || addressDetails.memoId === '') {
        // we want addresses to normalize without a memoId
        address = address.replace('?memoId=', '');
      }
      return address === this.normalizeAddress(addressDetails);
    } catch (e) {
      return false;
    }
  }

  /**
   * Generate Hedera Hashgraph key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new bitgoAccountLib.Hbar.KeyPair({ seed }) : new bitgoAccountLib.Hbar.KeyPair();
    const keys = keyPair.getKeys();

    if (!keys.prv) {
      throw new Error('Keypair generation failed to generate a prv');
    }

    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  parseTransaction(
    params: ParseTransactionOptions,
    callback?: NodeCallback<ParsedTransaction>
  ): Bluebird<ParsedTransaction> {
    return Bluebird.resolve({}).asCallback(callback);
  }

  verifyAddress(params: VerifyAddressOptions): boolean {
    return true;
  }

  verifyTransaction(params: VerifyTransactionOptions, callback?: NodeCallback<boolean>): Bluebird<boolean> {
    return Bluebird.resolve(true).asCallback(callback);
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {Object} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @param params.wallet.addressVersion {String} this is the version of the Algorand multisig address generation format
   * @param callback
   * @returns Bluebird<SignedTransaction>
   */
  signTransaction(
    params: HbarSignTransactionOptions,
    callback?: NodeCallback<SignedTransaction>
  ): Bluebird<SignedTransaction> {
    const self = this;
    return co<SignedTransaction>(function*() {
      const factory = bitgoAccountLib.register(self.getChain(), bitgoAccountLib.Hbar.TransactionBuilderFactory);
      const txBuilder = factory.from(params.txPrebuild.txHex);
      txBuilder.sign({ key: params.prv });

      const transaction: any = yield txBuilder.build();

      if (!transaction) {
        throw new Error('Invalid messaged passed to signMessage');
      }

      const response = {
        txHex: transaction.toBroadcastFormat(),
      };
      return transaction.signature.length >= 2 ? response : { halfSigned: response };
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   * @return {Buffer} A signature over the given message using the given key
   */
  signMessage(key: KeyPair, message: string | Buffer, callback?: NodeCallback<Buffer>): Bluebird<Buffer> {
    return co<Buffer>(function* cosignMessage() {
      const msg = Buffer.isBuffer(message) ? message.toString('utf8') : message;
      // reconstitute keys and sign
      return new bitgoAccountLib.Hbar.KeyPair({ prv: key.prv }).signMessage(msg);
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Builds a funds recovery transaction without BitGo.
   * We need to do three queries during this:
   * 1) Node query - how much money is in the account
   * 2) Build transaction - build our transaction for the amount
   * 3) Send signed build - send our signed build to a public node
   * @param params
   * @param callback
   */
  recover(params: any, callback?: NodeCallback<any>): Bluebird<any> {
    throw new MethodNotImplementedError();
  }

  /**
   * Explain a Hedera transaction from txHex
   * @param params
   * @param callback
   */
  explainTransaction(
    params: ExplainTransactionOptions,
    callback?: NodeCallback<TransactionExplanation>
  ): Bluebird<TransactionExplanation> {
    const self = this;
    return co<TransactionExplanation>(function*() {
      const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
      if (!txHex) {
        throw new Error('missing explain tx parameters');
      }

      if (!params.feeInfo) {
        throw new Error('missing fee information');
      }

      const factory = bitgoAccountLib.register(self.getChain(), bitgoAccountLib.Hbar.TransactionBuilderFactory);
      const txBuilder = factory.from(txHex);
      const tx = yield txBuilder.build();
      const txJson = tx.toJson();

      if (tx._txBody.data !== 'cryptoTransfer') {
        // don't explain this
        throw new Error('Transaction format outside of cryptoTransfer not supported for explanation.');
      }

      const displayOrder = [
        'id',
        'outputAmount',
        'changeAmount',
        'outputs',
        'changeOutputs',
        'fee',
        'timestamp',
        'expiration',
        'memo',
      ];

      // TODO(BG-24809): get the memo from the toJson
      let memo = '';
      if (params.memo) {
        memo = params.memo.value;
      }

      const outputs = [
        {
          amount: txJson.amount.toString(),
          address: txJson.to,
          memo,
        },
      ];

      const explanationResult: SignTransactionOptions = {
        displayOrder,
        id: txJson.id,
        outputs,
        outputAmount: outputs[0].amount,
        changeOutputs: [], // account based does not use change outputs
        changeAmount: '0', // account base does not make change
        fee: params.feeInfo,
        timestamp: txJson.startTime,
        expiration: txJson.validDuration,
      };

      return explanationResult;
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Process address into address and memo id
   *
   * @param address the address
   * @returns object containing address and memo id
   */
  getAddressDetails(rawAddress: string): AddressDetails {
    let memoId: string | undefined = undefined;
    let address = rawAddress;

    if (rawAddress.includes('?memoId=')) {
      address = rawAddress.substr(0, rawAddress.indexOf('?'));
    }

    // failed to parse OR bad address
    if (!address || !bitgoAccountLib.Hbar.Utils.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${rawAddress}`);
    }

    // address doesn't have a memo id - this is ok
    if (rawAddress === address) {
      return { address, memoId };
    }

    memoId = rawAddress.substr(rawAddress.indexOf('?memoId=') + 8);
    // undefined is valid as in has not been specified
    if (typeof memoId !== 'undefined' && !this.isValidMemoId(memoId)) {
      throw new InvalidMemoIdError(`invalid address: '${address}', memoId is not valid`);
    }

    return { address, memoId };
  }

  /**
   * Validate and return address with appended memo id
   *
   * @param address
   * @param memoId
   */
  normalizeAddress({ address, memoId }: AddressDetails): string {
    if (memoId && this.isValidMemoId(memoId)) {
      return `${address}?memoId=${memoId}`;
    }
    return address;
  }

  /**
   * Validates whether a memo is potentially correct in hedera.
   *
   * @param memoId
   */
  isValidMemoId(memoId: string) {
    // TODO: change this to account-lib helper once its published
    if (typeof memoId !== 'undefined' && Buffer.from(memoId).length > 100) {
      return false;
    }
    return true;
  }

  isStellarSeed(seed: string): boolean {
    return SeedValidator.isValidEd25519SeedForCoin(seed, CoinFamily.XLM);
  }

  convertFromStellarSeed(seed: string): string | null {
    // assume this is a trust custodial seed if its a valid ed25519 prv
    if (!this.isStellarSeed(seed) || SeedValidator.hasCompetingSeedFormats(seed)) {
      return null;
    }

    if (SeedValidator.isValidEd25519SeedForCoin(seed, CoinFamily.XLM)) {
      const keyFromSeed = new bitgoAccountLib.Hbar.KeyPair({ seed: stellar.StrKey.decodeEd25519SecretSeed(seed) });
      const keys = keyFromSeed.getKeys();
      if (keys !== undefined && keys.prv) {
        return keys.prv;
      }
    }

    return null;
  }

  isValidPub(pub: string): boolean {
    return bitgoAccountLib.Hbar.Utils.isValidPublicKey(pub);
  }
}
