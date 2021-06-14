/**
 * @prettier
 */
import * as Bluebird from 'bluebird';
import * as accountLib from '@bitgo/account-lib';
import * as _ from 'lodash';
import {
  NaclWrapper,
  Multisig,
  Address,
  Seed,
  generateAccountFromSeed,
  generateAccount,
  isValidAddress,
  isValidSeed,
  Encoding,
  mergeMultisigTransactions,
} from 'algosdk';
import { BitGo } from '../../bitgo';

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
  keys: string[];
  sk: string;
  isHalfSigned: boolean;
}

export class Algo extends BaseCoin {
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
  valuelessTransferAllowed(): boolean {
    // TODO: this sounds like its true with the staking txes - confirm before launch
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
    const pair = seed ? generateAccountFromSeed(seed) : generateAccount();
    return {
      pub: pair.addr, // encoded pub
      prv: Seed.encode(pair.sk), // encoded seed
    };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub: string): boolean {
    return isValidAddress(pub);
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
    return isValidSeed(prv);
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {String} address the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidAddress(address: string): boolean {
    return isValidAddress(address);
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  signMessage(key: KeyPair, message: string | Buffer, callback?: NodeCallback<Buffer>): Bluebird<Buffer> {
    return co<Buffer>(function* cosignMessage() {
      // key.prv actually holds the encoded seed, but we use the prv name to avoid breaking the keypair schema.
      // See jsdoc comment in isValidPrv
      let seed: string | Uint8Array = key.prv;
      if (!this.isValidPrv(seed)) {
        throw new Error(`invalid seed: ${seed}`);
      }
      if (typeof seed === 'string') {
        try {
          seed = Seed.decode(seed).seed;
        } catch (e) {
          throw new Error(`could not decode seed: ${seed}`);
        }
      }
      const keyPair = generateAccountFromSeed(seed);

      if (!Buffer.isBuffer(message)) {
        message = Buffer.from(message);
      }

      return Buffer.from(NaclWrapper.sign(message, keyPair.sk));
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
        const displayOrder = ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'memo', 'type'];

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
        };

        return explanationResult;
      }

      if (tx.type === accountLib.BaseCoin.TransactionType.KeyRegistration) {
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

    if (
      !_.has(params.txPrebuild, 'keys[0]') ||
      !_.has(params.txPrebuild, 'keys[1]') ||
      !_.has(params.txPrebuild, 'keys[2]')
    ) {
      throw new Error('missing public keys parameter to sign transaction');
    }

    if (!_.isNumber(addressVersion)) {
      throw new Error('missing addressVersion parameter to sign transaction');
    }

    // we need to re-encode our public keys using algosdk's format
    const keys = [params.txPrebuild.keys[0], params.txPrebuild.keys[1], params.txPrebuild.keys[2]];

    // re-encode sk from our prv (this acts as a seed out of the keychain)
    const seed = Seed.decode(prv).seed;
    const pair = generateAccountFromSeed(seed);
    const sk = pair.sk;

    return { txHex, addressVersion, keys, sk, isHalfSigned };
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
    return co<SignedTransaction>(function* () {
      const { txHex, addressVersion, keys, sk, isHalfSigned } = this.verifySignTransactionParams(params);
      const encodedPublicKeys = _.map(keys, (k) => Address.decode(k).publicKey);

      // decode our unsigned/half-signed tx
      let transaction;
      let txToHex;
      try {
        txToHex = Buffer.from(txHex, 'base64');
        const initialDecodedTx = Encoding.decode(txToHex);

        // we need to scrub the txn of sigs for half-signed
        const decodedTx = isHalfSigned ? initialDecodedTx.txn : initialDecodedTx;

        transaction = Multisig.MultiSigTransaction.from_obj_for_encoding(decodedTx);
      } catch (e) {
        throw new Error('transaction needs to be a valid tx encoded as base64 string');
      }

      // sign our tx
      let signed = transaction.partialSignTxn({ version: addressVersion, threshold: 2, pks: encodedPublicKeys }, sk);

      // if we have already signed it, we'll have to merge that with our previous tx
      if (isHalfSigned) {
        signed = mergeMultisigTransactions([Buffer.from(signed), txToHex]);
      }

      const signedBase64 = Buffer.from(signed).toString('base64');

      if (isHalfSigned) {
        return { txHex: signedBase64 };
      } else {
        return { halfSigned: { txHex: signedBase64 } };
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
}
