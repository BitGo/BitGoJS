/**
 * @prettier
 */
import * as CsprLib from './lib';
import { ECPair } from '@bitgo/utxo-lib';
import BigNumber from 'bignumber.js';

import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import {
  BaseCoin,
  BitGoBase,
  InvalidAddressError,
  InvalidTransactionError,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionExplanation,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionType,
  UnexpectedAddressError,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';

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

interface CsprVerifyAddressOptions extends VerifyAddressOptions {
  rootAddress: string;
}

export class Cspr extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
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

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    // TODO: Implement when available on the SDK.
    return true;
  }

  /**
   * Check if address is valid, then make sure it matches the root address.
   *
   * @param {VerifyAddressOptions} params address and rootAddress to verify
   */
  async isWalletAddress(params: CsprVerifyAddressOptions): Promise<boolean> {
    const { address, rootAddress } = params;
    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }
    if (!this.isValidAddress(rootAddress)) {
      throw new InvalidAddressError('wallet root address is not valid');
    }

    const newAddressDetails = CsprLib.Utils.getAddressDetails(address);
    const rootAddressDetails = CsprLib.Utils.getAddressDetails(rootAddress);
    if (newAddressDetails.address.toLowerCase() !== rootAddressDetails.address.toLowerCase()) {
      throw new UnexpectedAddressError(`address validation failure: ${newAddressDetails.address} vs ${rootAddress}`);
    }
    return true;
  }

  /**
   * Generate Casper key pair - BitGo xpub format
   *
   * @param {Buffer} seed - Seed from which the new keypair should be generated, otherwise a random seed is used
   * @returns {Object} object with generated xpub and xprv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new CsprLib.KeyPair({ seed }) : new CsprLib.KeyPair();
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
      new CsprLib.KeyPair({ pub });
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
      new CsprLib.KeyPair({ prv });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Return boolean indicating whether input is valid CSPR address
   *
   * @param address the pub to be checked
   * @returns true if the address is valid
   */
  isValidAddress(address: string): boolean {
    try {
      const addressDetails = CsprLib.Utils.getAddressDetails(address);
      return address === CsprLib.Utils.normalizeAddress(addressDetails);
    } catch (e) {
      return false;
    }
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param {SignTransactionOptions} params data required to rebuild and sign the transaction
   * @param {TransactionPrebuild} params.txPrebuild prebuild object returned by platform
   * @param {String} params.prv user prv used to sign the transaction
   * @returns Bluebird<SignedTransaction>
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    const txBuilder = this.getBuilder().from(params.txPrebuild.txHex);
    const key = params.prv;
    txBuilder.sign({ key });

    const transaction: any = await txBuilder.build();
    if (!transaction) {
      throw new InvalidTransactionError('Error while trying to build transaction');
    }
    const response = {
      txHex: transaction.toBroadcastFormat(),
    };
    return transaction.signature.length >= 2 ? response : { halfSigned: response };
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  /**
   * Extend walletParams with extra params required for generating a Casper wallet
   *
   * Casper wallets have three three keys, user, backup and bitgo.
   * Initially, we need a root prv to generate the account, which must be distinct from all three keychains on the wallet.
   * If a root private key is not provided, a random one is generated.
   * The root public key is the basis for the wallet root address.
   */
  async supplementGenerateWallet(
    walletParams: SupplementGenerateWalletOptions
  ): Promise<SupplementGenerateWalletOptions> {
    if (walletParams.rootPrivateKey) {
      if (!this.isValidPrv(walletParams.rootPrivateKey) || walletParams.rootPrivateKey.length !== 64) {
        throw new Error('rootPrivateKey needs to be a hexadecimal private key string');
      }
    } else {
      const keyPair = ECPair.makeRandom();
      if (!keyPair.privateKey) {
        throw new Error('no privateKey');
      }
      walletParams.rootPrivateKey = keyPair.privateKey.toString('hex');
    }
    return walletParams;
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const keyPair = new CsprLib.KeyPair({ prv: key.prv });
    const messageHex = message instanceof Buffer ? message.toString('hex') : message;
    const signatureData = CsprLib.Utils.signMessage(keyPair, messageHex);
    return Buffer.from(signatureData.signature);
  }

  /**
   * Explain a Casper transaction from Raw Tx
   *
   * @param {ExplainTransactionOptions} params given explain transaction params
   * @param {String} params.txHex raw transaction
   * @param {String} params.halfSigned.txHex raw half signed transaction
   * @param {TransactionFee} fee fee information
   * @returns Bluebird<TransactionExplanation>
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
    if (!txHex || !params.feeInfo) {
      throw new Error('missing explain tx parameters');
    }
    const txBuilder = this.getBuilder().from(txHex);

    const tx: any = await txBuilder.build();
    if (!tx) {
      throw new InvalidTransactionError('Error while trying to build transaction');
    }
    const id = Buffer.from(tx.casperTx.hash).toString('hex');
    const amount = CsprLib.Utils.getTransferAmount(tx.casperTx.session);
    let transferId;
    const outputs: TransactionOutput[] = [];
    const operations: TransactionOperation[] = [];

    switch (tx.type) {
      case TransactionType.Send: {
        transferId = CsprLib.Utils.getTransferId(tx.casperTx.session);
        const toAddress = CsprLib.Utils.getTransferDestinationAddress(tx._deploy.session);
        outputs.push({
          address: toAddress,
          amount,
          coin: this.getChain(),
        });
        break;
      }
      case TransactionType.StakingLock: {
        const validator = CsprLib.Utils.getValidatorAddress(tx._deploy.session);
        operations.push({
          type: TransactionType.StakingLock,
          amount,
          coin: this.getChain(),
          validator: validator,
        });
        break;
      }
      case TransactionType.StakingUnlock: {
        const validator = CsprLib.Utils.getValidatorAddress(tx._deploy.session);
        operations.push({
          type: TransactionType.StakingUnlock,
          amount,
          coin: this.getChain(),
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
    } as any;
  }

  private getBuilder(): CsprLib.TransactionBuilderFactory {
    return new CsprLib.TransactionBuilderFactory(coins.get(this.getChain()));
  }
}
