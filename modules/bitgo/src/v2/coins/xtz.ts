/**
 * @prettier
 */
import * as bip32 from 'bip32';
import { CoinFamily, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
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
import BigNumber from 'bignumber.js';
import { MethodNotImplementedError } from '../../errors';

export interface XtzSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TxInfo {
  recipients: Recipient[];
  from: string;
  txid: string;
}

export interface AddressInfo {
  address: string;
  chain: number;
  index: number;
}

export interface TransactionPrebuild extends BaseTransactionPrebuild {
  txHex: string;
  txInfo: TxInfo;
  addressInfo: AddressInfo;
  feeInfo: XtzTransactionFee;
  source: string;
  dataToSign: string;
}

export interface XtzTransactionFee {
  fee: string;
  gasLimit?: string;
  storageLimit?: string;
}

export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
  feeInfo: TransactionFee;
}

export class Xtz extends BaseCoin {
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
    return new Xtz(bitgo, staticsCoin);
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return true;
  }

  /**
   * Xtz supports transfers to consolidate balance from receive address to the wallet contract
   */
  allowsAccountConsolidations(): boolean {
    return true;
  }

  /**
   * Checks if this is a valid base58 or hex address
   * @param address
   */
  isValidAddress(address: string): boolean {
    if (!address) {
      return false;
    }
    return bitgoAccountLib.Xtz.Utils.isValidAddress(address);
  }

  /**
   * Generate Tezos key pair - BitGo xpub format
   *
   * @param seed
   * @returns {Object} object with generated xpub, xprv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new bitgoAccountLib.Xtz.KeyPair({ seed }) : new bitgoAccountLib.Xtz.KeyPair();
    const keys = keyPair.getExtendedKeys();

    if (!keys.xprv) {
      throw new Error('Missing xprv in key generation.');
    }

    return {
      pub: keys.xpub,
      prv: keys.xprv,
    };
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  isWalletAddress(params: VerifyAddressOptions): boolean {
    throw new MethodNotImplementedError();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    return true;
  }

  /**
   * Derive a user key using the chain path of the address
   * @param key
   * @param path
   * @returns {string} derived private key
   */
  deriveKeyWithPath({ key, path }: { key: string; path: string }): string {
    const keychain = bip32.fromBase58(key);
    const derivedKeyNode = keychain.derivePath(path);
    return derivedKeyNode.toBase58();
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {Object} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @param params.wallet.addressVersion {String} this is the version of the Algorand multisig address generation format
   * @returns Bluebird<SignedTransaction>
   */
  async signTransaction(params: XtzSignTransactionOptions): Promise<SignedTransaction> {
    const txBuilder: any = bitgoAccountLib.getBuilder(this.getChain());
    txBuilder.from(params.txPrebuild.txHex);
    txBuilder.source(params.txPrebuild.source);
    if (params.txPrebuild.dataToSign) {
      txBuilder.overrideDataToSign({ dataToSign: params.txPrebuild.dataToSign });
    }
    // The path /0/0/0/0 is used by the wallet base address
    // Derive the user key only if the transaction is sent from a receive address
    let key;
    const { chain, index } = params.txPrebuild.addressInfo;
    if (chain === 0 && index === 0) {
      key = params.prv;
    } else {
      const derivationPath = `0/0/${chain}/${index}`;
      key = this.deriveKeyWithPath({ key: params.prv, path: derivationPath });
    }
    txBuilder.sign({ key });

    const transaction = await txBuilder.build();
    if (!transaction) {
      throw new Error('Invalid messaged passed to signMessage');
    }
    const response = {
      txHex: transaction.toBroadcastFormat(),
    };
    return transaction.signature.length >= 2 ? response : { halfSigned: response };
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const keyPair = new bitgoAccountLib.Xtz.KeyPair({ prv: key.prv });
    const messageHex = message instanceof Buffer ? message.toString('hex') : Buffer.from(message).toString('hex');
    const signatureData = await bitgoAccountLib.Xtz.Utils.sign(keyPair, messageHex);
    return Buffer.from(signatureData.sig);
  }

  /**
   * Builds a funds recovery transaction without BitGo.
   * We need to do three queries during this:
   * 1) Node query - how much money is in the account
   * 2) Build transaction - build our transaction for the amount
   * 3) Send signed build - send our signed build to a public node
   * @param params
   */
  async recover(params: any): Promise<any> {
    throw new MethodNotImplementedError();
  }

  /**
   * Explain a Tezos transaction from txHex
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
    if (!txHex || !params.feeInfo) {
      throw new Error('missing explain tx parameters');
    }
    const txBuilder = bitgoAccountLib.getBuilder(this.getChain());
    // Newer coins can return BaseTransactionBuilderFactory instead of BaseTransactionBuilder
    if (!(txBuilder instanceof bitgoAccountLib.BaseCoin.BaseTransactionBuilder)) {
      throw new Error('getBuilder() did not return an BaseTransactionBuilder object. Has it been updated?');
    }
    txBuilder.from(txHex);
    const tx = await txBuilder.build();

    const displayOrder = ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee'];

    return {
      displayOrder,
      id: tx.id,
      outputs: tx.outputs,
      outputAmount: tx.outputs
        .reduce((accumulator, output) => accumulator.plus(output.value), new BigNumber('0'))
        .toFixed(0),
      changeOutputs: [], // account based does not use change outputs
      changeAmount: '0', // account base does not make change
      fee: params.feeInfo,
    } as any;
  }

  isValidPub(pub: string): boolean {
    return bitgoAccountLib.Xtz.Utils.isValidPublicKey(pub);
  }
}
