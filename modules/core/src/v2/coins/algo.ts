/**
 * @prettier
 */
import * as Bluebird from 'bluebird';
import * as accountLib from '@bitgo/account-lib';
import * as _ from 'lodash';
import { BitGo } from '../../bitgo';
import { SeedValidator } from '../internal/seedValidator';
import { CoinFamily } from '@bitgo/statics';

import {
  BaseCoin,
  TransactionExplanation,
  KeyPair,
  ParseTransactionOptions,
  ParsedTransaction,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  SignedTransaction,
  TransactionRecipient,
  SignTransactionOptions as BaseSignTransactionOptions,
} from '../baseCoin';
import { KeyIndices } from '../keychains';
import { NodeCallback } from '../types';

const co = Bluebird.coroutine;

export interface AlgoTransactionExplanation extends TransactionExplanation {
  memo?: string;
  type?: string;
  voteKey?: string;
  selectionKey?: string;
  voteFirst?: number;
  voteLast?: number;
  voteKeyDilution?: number;
  tokenId?: number;
  operations?: TransactionOperation[];
}

export interface TransactionOperation {
  type: string;
  coin: string;
}

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TransactionPrebuild {
  txHex: string;
  halfSigned?: {
    txHex: string;
  };
  txInfo: {
    from: string;
    to: string;
    amount: string;
    fee: number;
    firstRound: number;
    lastRound: number;
    genesisID: string;
    genesisHash: string;
    note?: string;
  };
  keys: string[];
  addressVersion: number;
}

export interface FullySignedTransaction {
  txHex: string;
}

export interface HalfSignedTransaction {
  halfSigned: {
    txHex: string;
  };
}

export interface TransactionFee {
  fee: string;
}
export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
  publicKeys?: string[];
  feeInfo: TransactionFee;
}

export interface VerifiedTransactionParameters {
  txHex: string;
  addressVersion: number;
  signers: string[];
  prv: string;
  isHalfSigned: boolean;
  numberSigners: number;
}

export class Algo extends BaseCoin {
  readonly ENABLE_TOKEN = 'enabletoken';
  readonly DISABLE_TOKEN = 'disabletoken';

  constructor(bitgo: BitGo) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Algo(bitgo);
  }

  getChain(): string {
    return 'algo';
  }

  getFamily(): string {
    return 'algo';
  }

  getFullName(): string {
    return 'Algorand';
  }

  getBaseFactor(): any {
    return 1e6;
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(type?: unknown): boolean {
    // TODO: this sounds like its true with the staking txes - confirm before launch
    if (typeof type === 'string' && (type === this.ENABLE_TOKEN || type === this.DISABLE_TOKEN)) {
      return true;
    }

    return false;
  }

  /**
   * Algorand supports account consolidations. These are transfers from the receive addresses
   * to the main address.
   */
  allowsAccountConsolidations(): boolean {
    return true;
  }

  /**
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new accountLib.Algo.KeyPair({ seed }) : new accountLib.Algo.KeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }

    return {
      pub: keyPair.getAddress(),
      prv: accountLib.Algo.algoUtils.encodeSeed(Buffer.from(keyPair.getSigningKey())),
    };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub: string): boolean {
    return accountLib.Algo.algoUtils.isValidAddress(pub);
  }

  /**
   * Return boolean indicating whether input is valid seed for the coin
   * In Algorand, when the private key is encoded as base32 string only the first 32 bytes are taken,
   * so the encoded value is actually the seed
   *
   * @param {String} prv the prv to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPrv(prv: string): boolean {
    return accountLib.Algo.algoUtils.isValidSeed(prv);
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {String} address the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidAddress(address: string): boolean {
    return accountLib.Algo.algoUtils.isValidAddress(address);
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  signMessage(key: KeyPair, message: string | Buffer, callback?: NodeCallback<Buffer>): Bluebird<Buffer> {
    return co<Buffer>(function* cosignMessage() {
      const algoKeypair = new accountLib.Algo.KeyPair({ prv: key.prv });
      if (Buffer.isBuffer(message)) {
        message = message.toString('base64');
      }
      return algoKeypair.signMessage(message);
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Specifies what key we will need for signing` - Algorand needs the backup, bitgo pubs.
   */
  keyIdsForSigning(): number[] {
    return [KeyIndices.USER, KeyIndices.BACKUP, KeyIndices.BITGO];
  }

  /**
   * Explain/parse transaction
   * @param params
   * @param callback
   */
  explainTransaction(
    params: ExplainTransactionOptions,
    callback?: NodeCallback<AlgoTransactionExplanation>
  ): Bluebird<AlgoTransactionExplanation> {
    return co<AlgoTransactionExplanation>(function* () {
      const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
      if (!txHex || !params.feeInfo) {
        throw new Error('missing explain tx parameters');
      }

      const factory = accountLib.getBuilder(this.getChain()) as unknown as accountLib.Algo.TransactionBuilderFactory;

      const txBuilder = factory.from(txHex);
      const tx = (yield txBuilder.build()) as any;
      const txJson = tx.toJson();

      if (tx.type === accountLib.BaseCoin.TransactionType.Send) {
        const outputs: TransactionRecipient[] = [
          {
            address: txJson.to,
            amount: txJson.amount,
            memo: txJson.note,
          },
        ];
        const operations: TransactionOperation[] = [];

        const isTokenTx = this.isTokenTx(txJson.type);
        if (isTokenTx) {
          operations.push({
            type: this.getTokenTxType(txJson),
            coin: `${this.getChain()}:${txJson.tokenId}`,
          });
        }

        const displayOrder = [
          'id',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
          'type',
          'operations',
        ];

        const explanationResult: AlgoTransactionExplanation = {
          displayOrder,
          id: txJson.id,
          outputAmount: txJson.amount.toString(),
          changeAmount: '0',
          outputs,
          changeOutputs: [],
          fee: txJson.fee,
          memo: txJson.note,
          type: tx.type,
          operations,
        };

        if (txJson.tokenId) explanationResult.tokenId = txJson.tokenId;

        return explanationResult;
      }

      if (tx.type === accountLib.BaseCoin.TransactionType.WalletInitialization) {
        const displayOrder = [
          'id',
          'fee',
          'memo',
          'type',
          'voteKey',
          'selectionKey',
          'voteFirst',
          'voteLast',
          'voteKeyDilution',
        ];

        const explanationResult: AlgoTransactionExplanation = {
          displayOrder,
          id: txJson.id,
          outputAmount: '0',
          changeAmount: '0',
          outputs: [],
          changeOutputs: [],
          fee: txJson.fee,
          memo: txJson.note,
          type: tx.type,
          voteKey: txJson.voteKey,
          selectionKey: txJson.selectionKey,
          voteFirst: txJson.voteFirst,
          voteLast: txJson.voteLast,
          voteKeyDilution: txJson.voteKeyDilution,
        };
        return explanationResult;
      }
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * returns if a tx is an enable or disable token tx
   * @param tx - tx in JSON format
   * @returns true if it's a token tx
   */
  getTokenTxType(tx: { amount: string; closeRemainderTo: string; from: string; to: string }): string {
    let type = 'transferToken';
    if (tx.amount === '0' && tx.from === tx.to) {
      type = !tx.closeRemainderTo ? 'enableToken' : 'disableToken';
    }
    return type;
  }

  /**
   * returns if a tx is a token tx
   * @param tx - tx in JSON format
   * @returns true if it's a token tx
   */
  isTokenTx(type: string): boolean {
    return type === 'axfer';
  }

  /**
   * Check if a seed is a valid stellar seed
   *
   * @param {String} seed the seed to check
   * @returns {Boolean} true if the input is a Stellar seed
   */
  isStellarSeed(seed: string): boolean {
    return SeedValidator.isValidEd25519SeedForCoin(seed, CoinFamily.XLM);
  }

  /**
   * Convert a stellar seed to an algo seed
   *
   * @param {String} seed the seed to convert
   * @returns {Boolean | null} seed in algo encoding
   */
  convertFromStellarSeed(seed: string): string | null {
    // assume this is a trust custodial seed if its a valid ed25519 prv
    if (!this.isStellarSeed(seed) || SeedValidator.hasCompetingSeedFormats(seed)) {
      return null;
    }

    if (SeedValidator.isValidEd25519SeedForCoin(seed, CoinFamily.XLM)) {
      return accountLib.Algo.algoUtils.convertFromStellarSeed(seed);
    }

    return null;
  }

  verifySignTransactionParams(params: SignTransactionOptions): VerifiedTransactionParameters {
    const prv = params.prv;
    const addressVersion = params.txPrebuild.addressVersion;
    let isHalfSigned = false;

    // it's possible this tx was already signed - take the halfSigned
    // txHex if it is
    let txHex = params.txPrebuild.txHex;
    if (params.txPrebuild.halfSigned) {
      isHalfSigned = true;
      txHex = params.txPrebuild.halfSigned.txHex;
    }

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

    if (!_.has(params.txPrebuild, 'keys')) {
      throw new Error('missing public keys parameter to sign transaction');
    }

    if (!_.isNumber(addressVersion)) {
      throw new Error('missing addressVersion parameter to sign transaction');
    }

    const signers = params.txPrebuild.keys.map((key) => {
      // if we are receiving addresses do not try to convert them
      if (!accountLib.Algo.algoUtils.isValidAddress(key)) {
        return accountLib.Algo.algoUtils.publicKeyToAlgoAddress(accountLib.Algo.algoUtils.toUint8Array(key));
      }
      return key;
    });
    // TODO(https://bitgoinc.atlassian.net/browse/STLX-6067): fix the number of signers using
    // should be similar to other coins implementation
    const numberSigners = Math.trunc(signers.length / 2) + 1;
    return { txHex, addressVersion, signers, prv, isHalfSigned, numberSigners };
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
  signTransaction(
    params: SignTransactionOptions,
    callback?: NodeCallback<SignedTransaction>
  ): Bluebird<SignedTransaction> {
    const self = this;
    return co<SignedTransaction>(function* () {
      const { txHex, signers, prv, isHalfSigned, numberSigners } = self.verifySignTransactionParams(params);
      const factory = accountLib.register(self.getChain(), accountLib.Algo.TransactionBuilderFactory);
      const txBuilder = factory.from(txHex);
      txBuilder.numberOfRequiredSigners(numberSigners);
      txBuilder.sign({ key: prv });
      txBuilder.setSigners(signers);
      const transaction: any = yield txBuilder.build();
      if (!transaction) {
        throw new Error('Invalid transaction');
      }
      const signedTxHex = Buffer.from(transaction.toBroadcastFormat()).toString('base64');
      if (numberSigners === 1) {
        return { txHex: signedTxHex };
      } else if (isHalfSigned) {
        return { txHex: signedTxHex };
      } else {
        return { halfSigned: { txHex: signedTxHex } };
      }
    })
      .call(this)
      .asCallback(callback);
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

  decodeTx(txn: Buffer): unknown {
    return accountLib.Algo.algoUtils.decodeAlgoTxn(txn);
  }

  getAddressFromPublicKey(Pubkey: Uint8Array): string {
    return accountLib.Algo.algoUtils.publicKeyToAlgoAddress(Pubkey);
  }
}
