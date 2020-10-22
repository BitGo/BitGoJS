/**
 * @prettier
 */
import { CoinFamily, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { getBuilder, Eth } from '@bitgo/account-lib';
import * as Bluebird from 'bluebird';
import * as bitcoinMessage from 'bitcoinjs-message';
import * as bitgoUtxoLib from '@bitgo/utxo-lib';
import { randomBytes } from 'crypto';

import {
  BaseCoin,
  FullySignedTransaction,
  HalfSignedTransaction,
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
import { InvalidAddressError, MethodNotImplementedError } from '../../errors';
import BigNumber from 'bignumber.js';

export interface EthSignTransactionOptions extends SignTransactionOptions {
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
  feeInfo: EthTransactionFee;
  source: string;
  dataToSign: string;
  nextContractSequenceId?: string;
  expireTime?: number;
}

export interface EthTransactionFee {
  fee: string;
  gasLimit?: string;
}

export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
  feeInfo: TransactionFee;
}

export interface HalfSignedEthLikeTransaction extends HalfSignedTransaction {
  halfSigned?: {
    txHex?: never;
    recipients: Recipient[];
    expiration?: number;
  };
}

export type SignedEthLikeTransaction = HalfSignedEthLikeTransaction | FullySignedTransaction;

export abstract class AbstractEthLikeCoin extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  getChain() {
    return this._staticsCoin.name;
  }

  /**
   * Get the base chain that the coin exists on.
   */
  getBaseChain() {
    return this.getChain();
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

  valuelessTransferAllowed(): boolean {
    return true;
  }

  isValidAddress(address: string): boolean {
    if (!address) {
      return false;
    }
    return Eth.Utils.isValidEthAddress(address);
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    if (!seed) {
      seed = randomBytes(512 / 8);
    }
    const extendedKey = bitgoUtxoLib.HDNode.fromSeedBuffer(seed);
    const xpub = extendedKey.neutered().toBase58();

    return {
      pub: xpub,
      prv: extendedKey.toBase58(),
    };
  }

  parseTransaction(
    params: ParseTransactionOptions,
    callback?: NodeCallback<ParsedTransaction>
  ): Bluebird<ParsedTransaction> {
    return Bluebird.resolve({}).asCallback(callback);
  }

  verifyAddress({ address }: VerifyAddressOptions): boolean {
    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }
    return true;
  }

  verifyTransaction(params: VerifyTransactionOptions, callback?: NodeCallback<boolean>): Bluebird<boolean> {
    return Bluebird.resolve(true).asCallback(callback);
  }

  async signTransaction(
    params: EthSignTransactionOptions,
    callback?: NodeCallback<SignedTransaction>
  ): Bluebird<SignedEthLikeTransaction> {
    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(params.txPrebuild.txHex);
    txBuilder.transfer().key(new Eth.KeyPair({ prv: params.prv }).getKeys().prv!);
    const transaction = await txBuilder.build();

    const recipients = transaction.outputs.map(output => ({ address: output.address, amount: output.value }));

    return {
      halfSigned: {
        txHex: transaction.toBroadcastFormat(),
        recipients: recipients,
        expiration: params.txPrebuild.expireTime,
      },
    };
  }

  async signMessage(key: { prv: string }, message: string | Buffer, callback?: NodeCallback<Buffer>): Bluebird<Buffer> {
    const privateKey = bitgoUtxoLib.HDNode.fromBase58(key.prv).getKey();
    const privateKeyBuffer = privateKey.d.toBuffer(32);
    const isCompressed = privateKey.compressed;
    const prefix = bitgoUtxoLib.networks.bitcoin.messagePrefix;
    return bitcoinMessage.sign(message, privateKeyBuffer, isCompressed, prefix);
  }

  isValidPub(pub: string): boolean {
    let valid = true;
    try {
      new Eth.KeyPair({ pub });
    } catch (e) {
      valid = false;
    }
    return valid;
  }

  /**
   * Builds a funds recovery transaction without BitGo.
   * We need to do three queries during this:
   * 1) Node query - how much money is in the account
   * 2) Build transaction - build our transaction for the amount
   * 3) Send signed build - send our signed build to a public node
   * @param params The options with which to recover
   * @param callback Callback for the result of this operation
   */
  recover(params: any, callback?: NodeCallback<any>): Bluebird<any> {
    throw new MethodNotImplementedError();
  }

  /**
   * Explain a transaction from txHex
   * @param params The options with which to explain the transaction
   * @param callback Callback for the result of this operation
   */
  async explainTransaction(
    params: ExplainTransactionOptions,
    callback?: NodeCallback<TransactionExplanation>
  ): Bluebird<TransactionExplanation> {
    const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
    if (!txHex || !params.feeInfo) {
      throw new Error('missing explain tx parameters');
    }
    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(txHex);
    const tx = await txBuilder.build();
    const outputs = tx.outputs.map(output => {
      return {
        address: output.address,
        amount: output.value,
      };
    });

    const displayOrder = ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee'];

    return {
      displayOrder,
      id: tx.id,
      outputs: outputs,
      outputAmount: outputs
        .reduce((accumulator, output) => accumulator.plus(output.amount), new BigNumber('0'))
        .toFixed(0),
      changeOutputs: [], // account based does not use change outputs
      changeAmount: '0', // account base does not make change
      fee: params.feeInfo,
    };
  }

  /**
   * Create a new transaction builder for the current chain
   * @return a new transaction builder
   */
  private getTransactionBuilder(): Eth.TransactionBuilder {
    return getBuilder(this.getBaseChain()) as Eth.TransactionBuilder;
  }
}
