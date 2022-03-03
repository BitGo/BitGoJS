/**
 * @prettier
 */
import * as accountLib from '@bitgo/account-lib';
import { BaseCoin as StaticsBaseCoin, CoinFamily } from '@bitgo/statics';

import {
  BaseCoin,
  KeyPair,
  SignedTransaction,
  TransactionExplanation,
  TransactionRecipient,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  SignTransactionOptions,
  TransactionPrebuild as BaseTransactionPrebuild,
} from '../baseCoin';
import { BitGo } from '../../bitgo';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
  publicKeys?: string[];
  feeInfo: TransactionFee;
}

export interface StxSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string | string[];
  pubKeys?: string[];
  numberSignature?: number;
}
export interface TransactionPrebuild extends BaseTransactionPrebuild {
  txHex: string;
  source: string;
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

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    // TODO: Implement when available on the SDK.
    return true;
  }

  /**
   * Check if address is valid, then make sure it matches the base address.
   *
   * @param {VerifyAddressOptions} params
   * @param {String} params.address - the address to verify
   * @param {String} params.baseAddress - the base address from the wallet
   */
  isWalletAddress(params: VerifyAddressOptions): boolean {
    const { address, keychains } = params;
    if (!keychains || keychains.length !== 3) {
      throw new Error('Invalid keychains');
    }
    const pubs = keychains.map((keychain) => accountLib.Stx.Utils.xpubToSTXPubkey(keychain.pub));
    const addressVersion = accountLib.Stx.Utils.getAddressVersion(address);
    const baseAddress = accountLib.Stx.Utils.getSTXAddressFromPubKeys(pubs, addressVersion).address;
    return accountLib.Stx.Utils.isSameBaseAddress(address, baseAddress);
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
      return accountLib.Stx.Utils.isValidAddressWithPaymentId(address);
    } catch (e) {
      return false;
    }
  }

  /**
   * Signs stacks transaction
   * @param params
   */
  async signTransaction(params: StxSignTransactionOptions): Promise<SignedTransaction> {
    const factory = accountLib.register(this.getChain(), accountLib.Stx.TransactionBuilderFactory);
    const txBuilder = factory.from(params.txPrebuild.txHex);
    const prvKeys = params.prv instanceof Array ? params.prv : [params.prv];
    prvKeys.forEach((prv) => txBuilder.sign({ key: prv }));
    if (params.pubKeys) txBuilder.fromPubKey(params.pubKeys);
    // if (params.numberSignature) txBuilder.numberSignatures(params.numberSignature);
    const transaction = await txBuilder.build();

    if (!transaction) {
      throw new Error('Invalid message passed to signMessage');
    }

    return {
      txHex: transaction.toBroadcastFormat(),
    };
  }

  async parseTransaction(params: any): Promise<any> {
    return {};
  }

  /**
   * Explain a Stacks transaction from txHex
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<StxTransactionExplanation | undefined> {
    const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
    if (!txHex || !params.feeInfo) {
      throw new Error('missing explain tx parameters');
    }

    const factory = accountLib.getBuilder(this.getChain()) as accountLib.Stx.TransactionBuilderFactory;
    const txBuilder = factory.from(txHex);

    if (params.publicKeys !== undefined) {
      txBuilder.fromPubKey(params.publicKeys);
      if (params.publicKeys.length === 1) {
        // definitely a single sig tx
        txBuilder.numberSignatures(1);
      }
    }

    const tx = await txBuilder.build();
    const txJson = tx.toJson();

    if (tx.type === accountLib.BaseCoin.TransactionType.Send) {
      const outputs: TransactionRecipient[] = [
        {
          address: txJson.payload.to,
          amount: txJson.payload.amount,
          memo: txJson.payload.memo,
        },
      ];

      const displayOrder = ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'memo', 'type'];
      return {
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
      return {
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
    }
  }
}
