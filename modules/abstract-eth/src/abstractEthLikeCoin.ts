/**
 * @prettier
 */
import type * as EthLikeCommon from '@ethereumjs/common';
import { CoinFamily, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { bip32 } from '@bitgo/secp256k1';
import { randomBytes } from 'crypto';
import {
  AuditDecryptedKeyParams,
  BaseCoin,
  bitcoin,
  BitGoBase,
  FullySignedTransaction,
  HalfSignedAccountTransaction,
  isValidPrv,
  isValidXprv,
  KeyPair,
  MethodNotImplementedError,
  ParsedTransaction,
  ParseTransactionOptions,
  SignTransactionOptions,
  TransactionExplanation,
  TransactionFee,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionRecipient as Recipient,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import BigNumber from 'bignumber.js';

import { isValidEthAddress, KeyPair as EthKeyPair, TransactionBuilder } from './lib';
import { VerifyEthAddressOptions } from './abstractEthLikeNewCoins';
import { auditEcdsaPrivateKey } from '@bitgo/sdk-lib-mpc';

export interface EthSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TxInfo {
  recipients: Recipient[];
  from: string;
  txid: string;
}

interface TransactionPrebuild extends BaseTransactionPrebuild {
  txHex?: string;
  txInfo: TxInfo;
  feeInfo: EthTransactionFee;
  source: string;
  dataToSign: string;
  nextContractSequenceId?: number;
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
  common?: EthLikeCommon.default;
}

export interface HalfSignedEthLikeTransaction extends HalfSignedAccountTransaction {
  halfSigned?: {
    txHex?: never;
    recipients: Recipient[];
    expiration?: number;
  };
}

export type SignedEthLikeTransaction = HalfSignedEthLikeTransaction | FullySignedTransaction;

export abstract class AbstractEthLikeCoin extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
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

  /** @inheritDoc */
  isEVM(): boolean {
    return true;
  }

  valuelessTransferAllowed(): boolean {
    return true;
  }

  /**
   * Check if the address is a valid eth address.
   */
  isValidAddress(address: string): boolean {
    if (!address) {
      return false;
    }
    return isValidEthAddress(address);
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    const extendedKey = bip32.fromSeed(seed || randomBytes(32));
    const xpub = extendedKey.neutered().toBase58();

    return {
      pub: xpub,
      prv: extendedKey.toBase58(),
    };
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  async isWalletAddress(params: VerifyEthAddressOptions): Promise<boolean> {
    throw new MethodNotImplementedError();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    return true;
  }

  async signTransaction(params: EthSignTransactionOptions): Promise<SignedEthLikeTransaction> {
    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(params.txPrebuild.txHex);
    txBuilder.transfer().key(new EthKeyPair({ prv: params.prv }).getKeys().prv!);
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

  isValidPub(pub: string): boolean {
    let valid = true;
    try {
      new EthKeyPair({ pub });
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
   * Explain a transaction from txHex
   * @param params The options with which to explain the transaction
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
    if (!txHex || !params.feeInfo) {
      throw new Error('missing explain tx parameters');
    }
    const txBuilder = this.getTransactionBuilder(params.common);
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
   * Create a new transaction builder for the current chain
   * @return a new transaction builder
   */
  protected abstract getTransactionBuilder(common?: EthLikeCommon.default): TransactionBuilder;

  /** @inheritDoc */
  auditDecryptedKey({ multiSigType, publicKey, prv }: AuditDecryptedKeyParams): void {
    if (multiSigType === 'tss') {
      auditEcdsaPrivateKey(prv as string, publicKey as string);
    } else {
      if (!isValidPrv(prv) && !isValidXprv(prv)) {
        throw new Error('Invalid private key');
      }
      if (publicKey) {
        const genPubKey = bitcoin.HDNode.fromBase58(prv).neutered().toBase58();
        if (genPubKey !== publicKey) {
          throw new Error('Incorrect xpub');
        }
      }
    }
  }
}
