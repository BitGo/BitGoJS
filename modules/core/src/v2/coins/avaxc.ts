/**
 * @prettier
 */
import { BigNumber } from 'bignumber.js';
// import * as debugLib from 'debug';

import {
  BaseCoin,
  FullySignedTransaction,
  HalfSignedAccountTransaction,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  SignTransactionOptions as BaseSignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  TransactionFee,
  TransactionRecipient as Recipient,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionExplanation,
} from '../baseCoin';

import { BitGo } from '../../bitgo';
import { InvalidAddressError, MethodNotImplementedError } from '../../errors';
import { BaseCoin as StaticsBaseCoin, CoinFamily } from '@bitgo/statics';
import { getBuilder, Eth, AvaxC as AvaxCAccountLib } from '@bitgo/account-lib';

// const debug = debugLib('bitgo:v2:avaxc');

// For explainTransaction
export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
  feeInfo: TransactionFee;
}

// For txPreBuild
export interface TxInfo {
  recipients: Recipient[];
  from: string;
  txid: string;
}

export interface EthTransactionFee {
  fee: string;
  gasLimit?: string;
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

// For signTransaction
export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface HalfSignedTransaction extends HalfSignedAccountTransaction {
  halfSigned: {
    txHex?: never;
    recipients: Recipient[];
    expiration?: number;
  };
}

export type SignedTransaction = HalfSignedTransaction | FullySignedTransaction;

export class AvaxC extends BaseCoin {
  static hopTransactionSalt = 'bitgoHopAddressRequestSalt';

  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new AvaxC(bitgo, staticsCoin);
  }

  // static buildTransaction() : {
  //
  //
  // }
  //
  getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
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

  valuelessTransferAllowed(): boolean {
    return true;
  }

  isValidAddress(address: string): boolean {
    return !!address && AvaxCAccountLib.Utils.isValidEthAddress(address);
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    const avaxKeyPair = seed ? new AvaxCAccountLib.KeyPair({ seed }) : new AvaxCAccountLib.KeyPair();
    const extendedKeys = avaxKeyPair.getExtendedKeys();
    return {
      pub: extendedKeys.xpub,
      prv: extendedKeys.xprv!,
    };
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  verifyAddress({ address }: VerifyAddressOptions): boolean {
    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }
    return true;
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    return true;
  }

  isValidPub(pub: string): boolean {
    let valid = true;
    try {
      new AvaxCAccountLib.KeyPair({ pub });
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
   */
  async recover(params: any): Promise<any> {
    throw new MethodNotImplementedError();
  }

  /**
   * Create a new transaction builder for the current chain
   * @return a new transaction builder
   */
  protected getTransactionBuilder(): Eth.TransactionBuilder {
    return getBuilder(this.getBaseChain()) as Eth.TransactionBuilder;
  }

  /**
   * Explain a transaction from txHex, overriding BaseCoins
   * @param params The options with which to explain the transaction
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
    if (!txHex || !params.feeInfo) {
      throw new Error('missing explain tx parameters');
    }
    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(txHex);
    const tx = await txBuilder.build();
    const outputs = tx.outputs.map((output) => {
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
   * Assemble half-sign prebuilt transaction
   * @param params
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(params.txPrebuild.txHex);
    txBuilder.transfer().key(new AvaxCAccountLib.KeyPair({ prv: params.prv }).getKeys().prv!);
    const transaction = await txBuilder.build();

    const recipients = transaction.outputs.map((output) => ({ address: output.address, amount: output.value }));

    return {
      halfSigned: {
        txHex: transaction.toBroadcastFormat(),
        recipients: recipients,
        expiration: params.txPrebuild.expireTime,
      },
    };
  }

  // async getExtraPreBuildParams(buildParams: )
}
