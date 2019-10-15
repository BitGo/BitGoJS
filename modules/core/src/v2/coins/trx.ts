/**
 * @prettier
 */
import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;
const tronWeb = require('tronweb');
//const TronLib = require('@bitgo/tron-lib');
import * as TronLib from '@bitgo/tron-lib';
import Tron from '@bitgo/tron-lib/dist/src/index';
// const tronproto = require('@bitgo/tron-lib/src/protobuf/tron_pb.js');
// const troncontractproto = require('@bitgo/tron-lib/Contract_pb.js');

import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { MethodNotImplementedError } from '../../errors';
import {
  BaseCoin,
  TransactionExplanation,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '../baseCoin';
import * as utxoLib from 'bitgo-utxo-lib';
import { BitGo } from '../../bitgo';
import { NodeCallback } from '../types';
//import { interface } from 'tcomb'; // FIXME
//import { Transaction } from 'stellar-sdk'; // FIXME

interface ExplainTransactionOptions {
  // transaction: { packed_trx: string };
  // headers: EosTransactionHeaders;
  txHex?: string; // unsigned and fully signed?
  halfSigned?: {
    txHex: string;
  };
  fee: number;
  txID: string;
}

export interface TronSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TransactionPrebuild {
  txHex: string;
  txid: string;
  transaction: any;
  txInfo: {
    from: string;
    to: string;
    amount: string;
    fee: number;
    txID: string;
  };
}

export class Trx extends BaseCoin {
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

  getFamily() {
    return this._staticsCoin.family;
  }

  getFullName() {
    return this._staticsCoin.fullName;
  }

  getBaseFactor() {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Trx(bitgo, staticsCoin);
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return true;
  }

  isValidAddress(address: string): boolean {
    return this.getCoinLibrary().isAddress(address);
  }

  /**
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const account = tronWeb.utils.accounts.generateAccount();
    return {
      pub: account.publicKey,
      prv: account.privateKey,
    };
  }

  /**
   * Get an instance of the library which can be used to perform low-level operations for this coin
   */
  getCoinLibrary() {
    return tronWeb;
  }

  isValidXpub(xpub: string): boolean {
    try {
      return utxoLib.HDNode.fromBase58(xpub).isNeutered();
    } catch (e) {
      return false;
    }
  }

  isValidPub(pub: string): boolean {
    if (this.isValidXpub(pub)) {
      // xpubs can be converted into regular pubs, so technically it is a valid pub
      return true;
    }
    return new RegExp('^04[a-zA-Z0-9]{128}$').test(pub);
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

  signTransaction(params: TronSignTransactionOptions): SignedTransaction {
    const tx = params.txPrebuild.transaction;
    // this prv should be hex-encoded
    const halfSigned = tronWeb.utils.crypto.signTransaction(params.prv, tx);
    if (_.isEmpty(halfSigned.signature)) {
      throw new Error('failed to sign transaction');
    }
    return { halfSigned };
  }

  /**
   * Derive a hardened child public key from a master key seed using an additional seed for randomness.
   *
   * Due to technical differences between keypairs on the ed25519 curve and the secp256k1 curve,
   * only hardened private key derivation is supported.
   *
   * @param key seed for the master key. Note: Not the public key or encoded private key. This is the raw seed.
   * @param entropySeed random seed which is hashed to generate the derivation path
   */
  deriveKeyWithSeed({ key, seed }: { key: string; seed: string }): { derivationPath: string; key: string } {
    // TODO: not sure if we need this just yet
    throw new MethodNotImplementedError();
  }

  /**
   * Convert a message to string in hexadecimal format.
   *
   * @param message {Buffer|String} message to sign
   * @return the message as a hexadecimal string
   */
  toHexString(message: string | Buffer): string {
    if (typeof message === 'string') {
      return Buffer.from(message).toString('hex');
    } else if (Buffer.isBuffer(message)) {
      return message.toString('hex');
    } else {
      throw new Error('Invalid messaged passed to signMessage');
    }
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  signMessage(key: KeyPair, message: string | Buffer): Buffer {
    const toSign = this.toHexString(message);

    let sig = tronWeb.Trx.signString(toSign, key.prv, true);

    // remove the preceding 0x
    sig = sig.replace(/^0x/, '');

    return Buffer.from(sig, 'hex');
  }

  // it's possible we need to implement these later
  // preCreateBitGo?
  // supplementGenerateWallet?

  // expectation

  /**
   * Explain a Tron transaction
   * Use case: In OVC, after user has updated either a halfsigned or fully signd
   * transaction, we confirm with them the tx details by explaining the tx
   * QUESTION - will explain tx ever be used for explaining a tx without sig?
   * @param params
   * @param callback
   */
  explainTransaction(
    params: ExplainTransactionOptions,
    callback?: NodeCallback<TransactionExplanation>
  ): Bluebird<TransactionExplanation> {
    return co<TransactionExplanation>(function*() {
      const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
      if (!txHex) {
        throw new Error('missing required param txHex or halfSigned.txHex');
      }
      if (!params.fee) {
        throw new Error('explain params must contain fee property');
      }
      if (!params.txID) {
        throw new Error('explain params must contain id property');
      }
      const txData = Tron.getTransactionData(txHex); // TODO reference the right tron lib branch
      const transfer = Tron.decodeTransferContract(txData.transferContractRaw);
      const outputAmount = transfer.amount;
      const outputs = {
        amount: outputAmount,
        address: transfer.toAddress,
      };
      return {
        displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'memo'],
        id: params.txID, // FIXME
        outputs,
        outputAmount,
        changeOutputs: [], // account based does not use change outputs?
        changeAmount: 0, // account base does not make change
        fee: params.fee,
        expiration: txData.expiration,
        timestamp: txData.timestamp,
      };
    })
      .call(this)
      .asCallback(callback);
  }
}
