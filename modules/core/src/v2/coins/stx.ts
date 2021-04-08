/**
 * @prettier
 */
import * as Bluebird from 'bluebird';
import * as accountLib from '@bitgo/account-lib';
import { ECPair } from '@bitgo/utxo-lib';
import {
  BaseCoin,
  KeyPair,
  SignedTransaction,
  TransactionExplanation,
  TransactionRecipient,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '../baseCoin';
import { NodeCallback } from '../types';
import { BitGo } from '../../bitgo';
import { BaseCoin as StaticsBaseCoin, CoinFamily } from '@bitgo/statics';

const co = Bluebird.coroutine;

interface SupplementGenerateWalletOptions {
  rootPrivateKey?: string;
}

export interface TransactionFee {
  fee: string;
}
export interface StxTransactionExplanation extends TransactionExplanation {
  memo?: string;
  type?: number;
  contractAddress?: string;
  contractName?: string;
  contractFunction?: string;
  contractFunctionArgs?: { type: string; value: string }[];
}

export interface ExplainTransactionOptions {
  txHex?: string; // txHex is poorly named here; it is just a wrapped JSON object
  halfSigned?: {
    txHex: string; // txHex is poorly named here; it is just a wrapped JSON object
  };
  feeInfo: TransactionFee;
}

export class Stx extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Stx(bitgo, staticsCoin);
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
   * Generate Stacks key pair
   *
   * @param {Buffer} seed - Seed from which the new keypair should be generated, otherwise a random seed is used
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new accountLib.Stx.KeyPair({ seed }) : new accountLib.Stx.KeyPair();
    const keys = keyPair.getExtendedKeys();

    if (!keys.xprv) {
      throw new Error('Missing xprv in key generation.');
    }

    return {
      pub: keys.xpub,
      prv: keys.xprv,
    };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {string} pub the prv to be checked
   * @returns is it valid?
   */
  isValidPub(pub: string): boolean {
    try {
      return accountLib.Stx.Utils.isValidPublicKey(pub);
    } catch (e) {
      return false;
    }
  }

  /**
   * Return boolean indicating whether input is valid private key for the coin
   *
   * @param {string} prv the prv to be checked
   * @returns is it valid?
   */
  isValidPrv(prv: string): boolean {
    try {
      return accountLib.Stx.Utils.isValidPrivateKey(prv);
    } catch (e) {
      return false;
    }
  }

  isValidAddress(address: string): boolean {
    try {
      return accountLib.Stx.Utils.isValidAddress(address);
    } catch (e) {
      return false;
    }
  }

  signTransaction(params: any): Bluebird<SignedTransaction> {
    throw new Error('Method not implemented.');
  }
  parseTransaction(params: any, callback?: NodeCallback<any>): Bluebird<any> {
    throw new Error('Method not implemented.');
  }

  /**
   * Explain a Stacks transaction from txHex
   * @param params
   * @param callback
   */
  explainTransaction(
    params: ExplainTransactionOptions,
    callback?: NodeCallback<StxTransactionExplanation>
  ): Bluebird<StxTransactionExplanation> {
    const self = this;
    return co<TransactionExplanation>(function*() {
      const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
      if (!txHex || !params.feeInfo) {
        throw new Error('missing explain tx parameters');
      }

      const factory = accountLib.getBuilder(self.getChain());
      const txBuilder = factory.from(txHex);

      if (!(txBuilder instanceof accountLib.BaseCoin.BaseTransactionBuilder)) {
        throw new Error('getBuilder() did not return an BaseTransactionBuilder object. Has it been updated?');
      }

      const tx = yield txBuilder.build();
      const txJson = tx.toJson();

      if (tx.type === accountLib.BaseCoin.TransactionType.Send) {
        const outputs: TransactionRecipient[] = [
          {
            address: txJson.payload.to,
            amount: txJson.payload.amount,
            memo: txJson.payload.memo,
          },
        ];

        const displayOrder = ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type'];
        const explanationResult: StxTransactionExplanation = {
          displayOrder,
          id: txJson.id,
          outputAmount: txJson.payload.amount.toString(),
          changeAmount: '0',
          outputs,
          changeOutputs: [],
          fee: txJson.fee,
          memo: txJson.payload.memo,
          type: tx.type,
        };

        return explanationResult;
      }

      if (tx.type === accountLib.BaseCoin.TransactionType.ContractCall) {
        const displayOrder = [
          'id',
          'fee',
          'type',
          'contractAddress',
          'contractName',
          'contractFunction',
          'contractFunctionArgs',
        ];
        const explanationResult: StxTransactionExplanation = {
          displayOrder,
          id: txJson.id,
          changeAmount: '0',
          outputAmount: '',
          outputs: [],
          changeOutputs: [],
          fee: txJson.fee,
          type: tx.type,
          contractAddress: txJson.payload.contractAddress,
          contractName: txJson.payload.contractName,
          contractFunction: txJson.payload.functionName,
          contractFunctionArgs: txJson.payload.functionArgs,
        };

        return explanationResult;
      }
    })
      .call(this)
      .asCallback(callback);
  }
}
