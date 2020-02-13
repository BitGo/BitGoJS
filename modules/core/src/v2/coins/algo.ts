/**
 * @prettier
 */
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as stellar from 'stellar-sdk';
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
  TransactionExplanation as BaseTransactionExplanation,
  KeyPair,
  ParseTransactionOptions,
  ParsedTransaction,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  SignedTransaction,
} from '../baseCoin';
import { KeyIndices } from '../keychains';
import { NodeCallback } from '../types';

const co = Bluebird.coroutine;

export interface TransactionExplanation extends BaseTransactionExplanation {
  memo: string;
  type?: string;
  senderAddress?: string;
  voteKeyBase64?: string;
  voteLastBlock?: number;
}

export interface SignTransactionOptions {
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

export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
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
  signMessage(key: KeyPair, message: string | Buffer): Buffer {
    // key.prv actually holds the encoded seed, but we use the prv name to avoid breaking the keypair schema.
    // See jsdoc comment in isValidPrv
    let seed = key.prv;
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
    callback?: NodeCallback<TransactionExplanation>
  ): Bluebird<TransactionExplanation> {
    return co<TransactionExplanation>(function*() {
      // take txHex first always, but as it might already be signed, take halfSigned second
      const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);

      if (!txHex) {
        throw new Error('missing required param txHex or halfSigned.txHex');
      }
      let tx, type, senderAddress, voteKeyBase64, voteLastBlock;
      try {
        const txToHex = Buffer.from(txHex, 'base64');
        const decodedTx = Encoding.decode(txToHex);

        // if we are a signed msig tx, the structure actually has the { msig, txn } as the root object
        // if we are not signed, the decoded tx is the txn - refer to partialSignTxn and MultiSig constructor
        //   in algosdk for more information
        const txnForDecoding = decodedTx.txn || decodedTx;
        if (!!txnForDecoding.votekey) {
          type = txnForDecoding.type;
          senderAddress = Address.encode(txnForDecoding.snd);
          voteKeyBase64 = txnForDecoding.votekey.toString('base64');
          voteLastBlock = txnForDecoding.votelst;
        }

        tx = Multisig.MultiSigTransaction.from_obj_for_encoding(txnForDecoding);
      } catch (ex) {
        throw new Error('txHex needs to be a valid tx encoded as base64 string');
      }

      const id = tx.txID();
      const fee = { fee: tx.fee };

      const outputAmount = tx.amount || 0;
      const outputs: { amount: number; address: string }[] = [];
      if (tx.to) {
        outputs.push({
          amount: outputAmount,
          address: Address.encode(new Uint8Array(tx.to.publicKey)),
        });
      }

      // TODO(CT-480): add recieving address display here
      const memo = tx.note;

      return {
        displayOrder: [
          'id',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
          'type',
          'senderAddress',
          'voteKeyBase64',
          'voteLastBlock',
        ],
        id,
        outputs,
        outputAmount,
        changeAmount: 0,
        fee,
        changeOutputs: [],
        memo,
        type,
        senderAddress,
        voteKeyBase64,
        voteLastBlock,
      };
    })
      .call(this)
      .asCallback(callback);
  }

  isStellarSeed(seed: string): boolean {
    return stellar.StrKey.isValidEd25519SecretSeed(seed);
  }

  convertFromStellarSeed(seed: string): string | null {
    // assume this is a trust custodial seed if its a valid ed25519 prv
    if (!this.isStellarSeed(seed)) {
      return null;
    }
    return Seed.encode(stellar.StrKey.decodeEd25519SecretSeed(seed));
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
   * @param params.txPrebuild {Object} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @param params.wallet.addressVersion {String} this is the version of the Algorand multisig address generation format
   */
  signTransaction(params: SignTransactionOptions): SignedTransaction {
    const { txHex, addressVersion, keys, sk, isHalfSigned } = this.verifySignTransactionParams(params);
    const encodedPublicKeys = _.map(keys, k => Address.decode(k).publicKey);

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
