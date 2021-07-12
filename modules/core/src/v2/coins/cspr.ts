/**
 * @prettier
 */
import * as Bluebird from 'bluebird';
import * as accountLib from '@bitgo/account-lib';
import { ECPair } from '@bitgo/utxo-lib';
import BigNumber from 'bignumber.js';

import {
  BaseCoin,
  KeyPair,
  SignedTransaction,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionExplanation,
  ParseTransactionOptions,
  ParsedTransaction,
} from '../baseCoin';

import { NodeCallback } from '../types';
import { BitGo } from '../../bitgo';
import { BaseCoin as StaticsBaseCoin, CoinFamily } from '@bitgo/statics';
import { InvalidTransactionError } from '../../errors';

const co = Bluebird.coroutine;

interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TransactionPrebuild extends BaseTransactionPrebuild {
  txHex: string;
}

export interface TransactionFee {
  gasLimit: string;
  gasPrice: string;
}

export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
  feeInfo: TransactionFee;
}

interface SupplementGenerateWalletOptions {
  rootPrivateKey?: string;
}

interface TransactionOutput {
  address: string;
  amount: string;
  coin: string;
}

interface TransactionOperation {
  type: number;
  amount: string;
  coin: string;
  validator: string;
}

export class Cspr extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Cspr(bitgo, staticsCoin);
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
    return accountLib.Cspr.Utils.isValidAddress(params.address);
  }

  /**
   * Generate Casper key pair - BitGo xpub format
   *
   * @param {Buffer} seed - Seed from which the new keypair should be generated, otherwise a random seed is used
   * @returns {Object} object with generated xpub and xprv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new accountLib.Cspr.KeyPair({ seed }) : new accountLib.Cspr.KeyPair();
    const keys = keyPair.getExtendedKeys();

    if (!keys.xprv) {
      throw new Error('Missing xprv in key generation.');
    }

    return {
      pub: keys.xpub,
      prv: keys.xprv,
    };
  }

  isValidPub(pub: string): boolean {
    // TODO(STLX-1344): Validate using account-lib when available
    //  return accountLib.Cspr.Utils.isValidPublicKey(pub);
    try {
      new accountLib.Cspr.KeyPair({ pub });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Return boolean indicating whether input is valid private key for the coin
   *
   * @param prv the prv to be checked
   * @returns is it valid?
   */
  isValidPrv(prv: string): boolean {
    // TODO(STLX-1345): Validate using account-lib when available
    //  return accountLib.Cspr.Utils.isValidPrivateKey(prv);
    try {
      new accountLib.Cspr.KeyPair({ prv });
      return true;
    } catch (e) {
      return false;
    }
  }

  isValidAddress(address: string): boolean {
    try {
      return accountLib.Cspr.Utils.isValidAddress(address);
    } catch (error) {
      return false;
    }
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param {SignTransactionOptions} params data required to rebuild and sign the transaction
   * @param {TransactionPrebuild} params.txPrebuild prebuild object returned by platform
   * @param {String} params.prv user prv used to sign the transaction
   * @param {NodeCallback<SignedTransaction>} callback
   * @returns Bluebird<SignedTransaction>
   */
  signTransaction(
    params: SignTransactionOptions,
    callback?: NodeCallback<SignedTransaction>
  ): Bluebird<SignedTransaction> {
    const self = this;
    return co<SignedTransaction>(function* () {
      const txBuilder = accountLib.getBuilder(self.getChain()).from(params.txPrebuild.txHex);
      const key = params.prv;
      txBuilder.sign({ key });

      const transaction: any = yield txBuilder.build();
      if (!transaction) {
        throw new InvalidTransactionError('Error while trying to build transaction');
      }
      const response = {
        txHex: transaction.toBroadcastFormat(),
      };
      return transaction.signature.length >= 2 ? response : { halfSigned: response };
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

  /**
   * Extend walletParams with extra params required for generating a Casper wallet
   *
   * Casper wallets have three three keys, user, backup and bitgo.
   * Initially, we need a root prv to generate the account, which must be distinct from all three keychains on the wallet.
   * If a root private key is not provided, a random one is generated.
   * The root public key is the basis for the wallet root address.
   */
  supplementGenerateWallet(walletParams: SupplementGenerateWalletOptions): Bluebird<SupplementGenerateWalletOptions> {
    const self = this;
    return co<SupplementGenerateWalletOptions>(function* () {
      if (walletParams.rootPrivateKey) {
        if (!self.isValidPrv(walletParams.rootPrivateKey) || walletParams.rootPrivateKey.length !== 64) {
          throw new Error('rootPrivateKey needs to be a hexadecimal private key string');
        }
      } else {
        const keyPair = ECPair.makeRandom();
        walletParams.rootPrivateKey = keyPair.getPrivateKeyBuffer().toString('hex');
      }
      return walletParams;
    }).call(this);
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  signMessage(key: KeyPair, message: string | Buffer, callback?: NodeCallback<Buffer>): Bluebird<Buffer> {
    return co<Buffer>(function* cosignMessage() {
      const keyPair = new accountLib.Cspr.KeyPair({ prv: key.prv });
      const messageHex = message instanceof Buffer ? message.toString('hex') : message;
      const signatureData = accountLib.Cspr.Utils.signMessage(keyPair, messageHex);
      return Buffer.from(signatureData.signature).toString('hex');
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Explain a Casper transaction from Raw Tx
   *
   * @param {ExplainTransactionOptions} params given explain transaction params
   * @param {String} params.txHex raw transaction
   * @param {String} params.halfSigned.txHex raw half signed transaction
   * @param {TransactionFee} fee fee information
   * @param {Function} callback
   * @returns Bluebird<TransactionExplanation>
   */
  explainTransaction(
    params: ExplainTransactionOptions,
    callback?: NodeCallback<TransactionExplanation>
  ): Bluebird<TransactionExplanation> {
    const self = this;
    return co<TransactionExplanation>(function* () {
      const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
      if (!txHex || !params.feeInfo) {
        throw new Error('missing explain tx parameters');
      }
      const txBuilder = accountLib.getBuilder(self.getChain()).from(txHex);

      const tx: any = yield txBuilder.build();
      if (!tx) {
        throw new InvalidTransactionError('Error while trying to build transaction');
      }
      const id = Buffer.from(tx.casperTx.hash).toString('hex');
      const amount = accountLib.Cspr.Utils.getTransferAmount(tx.casperTx.session);
      let transferId;
      const outputs: TransactionOutput[] = [];
      const operations: TransactionOperation[] = [];

      switch (tx.type) {
        case accountLib.BaseCoin.TransactionType.Send: {
          transferId = accountLib.Cspr.Utils.getTransferId(tx.casperTx.session);
          const toAddress = accountLib.Cspr.Utils.getTransferDestinationAddress(tx._deploy.session);
          outputs.push({
            address: toAddress,
            amount,
            coin: self.getChain(),
          });
          break;
        }
        case accountLib.BaseCoin.TransactionType.StakingLock: {
          const validator = accountLib.Cspr.Utils.getValidatorAddress(tx._deploy.session);
          operations.push({
            type: accountLib.BaseCoin.TransactionType.StakingLock,
            amount,
            coin: self.getChain(),
            validator: validator,
          });
          break;
        }
        case accountLib.BaseCoin.TransactionType.StakingUnlock: {
          const validator = accountLib.Cspr.Utils.getValidatorAddress(tx._deploy.session);
          operations.push({
            type: accountLib.BaseCoin.TransactionType.StakingUnlock,
            amount,
            coin: self.getChain(),
            validator: validator,
          });
          break;
        }
        default: {
          throw new InvalidTransactionError('Error while trying to get transaction type');
        }
      }

      const outputAmount = outputs
        .reduce((acumulator, output) => {
          const currentValue = new BigNumber(output.amount);
          return acumulator.plus(currentValue);
        }, new BigNumber(0))
        .toFixed(0);

      const displayOrder = [
        'id',
        'outputAmount',
        'changeAmount',
        'outputs',
        'changeOutputs',
        'transferId',
        'fee',
        'operations',
      ];

      return {
        displayOrder,
        id,
        outputs,
        outputAmount,
        changeOutputs: [], // account based does not use change outputs
        changeAmount: '0', // account base does not make change
        transferId,
        fee: params.feeInfo,
        operations,
      };
    })
      .call(this)
      .asCallback(callback);
  }
}
