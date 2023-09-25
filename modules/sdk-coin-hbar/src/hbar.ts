/**
 * @prettier
 */
import { CoinFamily, BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import {
  BaseCoin,
  BitGoBase,
  KeyPair,
  MethodNotImplementedError,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  VerifyAddressOptions as BaseVerifyAddressOptions,
  VerifyTransactionOptions,
  TransactionFee,
  TransactionRecipient as Recipient,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionExplanation,
  Memo,
  TokenEnablementConfig,
} from '@bitgo/sdk-core';
import { BigNumber } from 'bignumber.js';
import * as stellar from 'stellar-sdk';
import { SeedValidator } from './seedValidator';
import { KeyPair as HbarKeyPair, TransactionBuilderFactory, Transaction } from './lib';
import * as Utils from './lib/utils';
import * as _ from 'lodash';

export interface HbarSignTransactionOptions extends SignTransactionOptions {
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
  feeInfo: TransactionFee;
  source: string;
}

export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
  feeInfo?: TransactionFee;
  // TODO(BG-24809): get the memo from the toJson
  memo?: {
    type: string;
    value: string;
  };
}

export interface HbarVerifyTransactionOptions extends VerifyTransactionOptions {
  txPrebuild: TransactionPrebuild;
  memo?: Memo;
}

interface VerifyAddressOptions extends BaseVerifyAddressOptions {
  baseAddress: string;
}

export class Hbar extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
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

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Hbar(bitgo, staticsCoin);
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return false;
  }

  /**
   * Checks if this is a valid base58 or hex address
   * @param address
   */
  isValidAddress(address: string): boolean {
    try {
      return Utils.isValidAddressWithPaymentId(address);
    } catch (e) {
      return false;
    }
  }

  /**
   * Generate Hedera Hashgraph key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new HbarKeyPair({ seed }) : new HbarKeyPair();
    const keys = keyPair.getKeys();

    if (!keys.prv) {
      throw new Error('Keypair generation failed to generate a prv');
    }

    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  /**
   * Check if address is valid, then make sure it matches the base address.
   *
   * @param {VerifyAddressOptions} params
   * @param {String} params.address - the address to verify
   * @param {String} params.baseAddress - the base address from the wallet
   */
  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    const { address, baseAddress } = params;
    return Utils.isSameBaseAddress(address, baseAddress);
  }

  async verifyTransaction(params: HbarVerifyTransactionOptions): Promise<boolean> {
    // asset name to transfer amount map
    const coinConfig = coins.get(this.getChain());
    const { txParams: txParams, txPrebuild: txPrebuild, memo: memo } = params;
    const transaction = new Transaction(coinConfig);
    if (!txPrebuild.txHex) {
      throw new Error('missing required tx prebuild property txHex');
    }

    transaction.fromRawTransaction(txPrebuild.txHex);
    const explainTxParams: ExplainTransactionOptions = {
      txHex: txPrebuild.txHex,
      feeInfo: txPrebuild.feeInfo,
      memo: memo,
    };
    const explainedTx = await this.explainTransaction(explainTxParams);

    if (!txParams.recipients) {
      throw new Error('missing required tx params property recipients');
    }

    // for enabletoken, recipient output amount is 0
    const recipients = txParams.recipients.map((recipient) => ({
      ...recipient,
      amount: txParams.type === 'enabletoken' ? '0' : recipient.amount,
    }));
    if (coinConfig.isToken) {
      recipients.forEach((recipient) => {
        if (recipient.tokenName !== undefined && recipient.tokenName !== coinConfig.name) {
          throw new Error('Incorrect token name specified in recipients');
        }
        recipient.tokenName = coinConfig.name;
      });
    }

    // verify recipients from params and explainedTx
    const filteredRecipients = recipients?.map((recipient) => _.pick(recipient, ['address', 'amount', 'tokenName']));
    const filteredOutputs = explainedTx.outputs.map((output) => _.pick(output, ['address', 'amount', 'tokenName']));

    if (!_.isEqual(filteredOutputs, filteredRecipients)) {
      throw new Error('Tx outputs does not match with expected txParams recipients');
    }

    return true;
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {Object} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @param params.wallet.addressVersion {String} this is the version of the Algorand multisig address generation format
   * @returns Promise<SignedTransaction>
   */
  async signTransaction(params: HbarSignTransactionOptions): Promise<SignedTransaction> {
    const factory = this.getBuilderFactory();
    const txBuilder = factory.from(params.txPrebuild.txHex);
    txBuilder.sign({ key: params.prv });

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
   * @return {Buffer} A signature over the given message using the given key
   */
  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const msg = Buffer.isBuffer(message) ? message.toString('utf8') : message;
    // reconstitute keys and sign
    return Buffer.from(new HbarKeyPair({ prv: key.prv }).signMessage(msg));
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
   * Explain a Hedera transaction from txHex
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
    if (!txHex) {
      throw new Error('missing explain tx parameters');
    }

    const factory = this.getBuilderFactory();
    const txBuilder = factory.from(txHex);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();

    let outputAmount = new BigNumber(0);
    const outputs: { address: string; amount: string; memo: string; tokenName?: string }[] = [];
    // TODO(BG-24809): get the memo from the toJson
    let memo = '';
    if (params.memo) {
      memo = params.memo.value;
    }

    switch (txJson.instructionsData.type) {
      case 'cryptoTransfer':
        const recipients = txJson.instructionsData.params.recipients || [];
        recipients.forEach((recipient) => {
          if (!recipient.tokenName) {
            // token transfer doesn't change outputAmount
            outputAmount = outputAmount.plus(recipient.amount);
          }
          outputs.push({
            address: recipient.address,
            amount: recipient.amount.toString(),
            memo,
            ...(recipient.tokenName && {
              tokenName: recipient.tokenName,
            }),
          });
        });
        break;

      case 'tokenAssociate':
        const tokens = txJson.instructionsData.params.tokenNames || [];
        const accountId = txJson.instructionsData.params.accountId;
        tokens.forEach((token) => {
          outputs.push({
            address: accountId,
            amount: '0',
            memo,
            tokenName: token,
          });
        });
        break;

      default:
        throw new Error('Transaction format outside of cryptoTransfer not supported for explanation.');
    }

    const displayOrder = [
      'id',
      'outputAmount',
      'changeAmount',
      'outputs',
      'changeOutputs',
      'fee',
      'timestamp',
      'expiration',
      'memo',
    ];

    return {
      displayOrder,
      id: txJson.id,
      outputs,
      outputAmount: outputAmount.toString(),
      changeOutputs: [], // account based does not use change outputs
      changeAmount: '0', // account base does not make change
      fee: params.feeInfo?.fee || txJson.fee, // in the instance no feeInfo is passed in as a param, show the fee given by the txJSON
      timestamp: txJson.startTime,
      expiration: txJson.validDuration,
    } as any;
  }

  isStellarSeed(seed: string): boolean {
    return SeedValidator.isValidEd25519SeedForCoin(seed, CoinFamily.XLM);
  }

  convertFromStellarSeed(seed: string): string | null {
    // assume this is a trust custodial seed if its a valid ed25519 prv
    if (!this.isStellarSeed(seed) || SeedValidator.hasCompetingSeedFormats(seed)) {
      return null;
    }

    if (SeedValidator.isValidEd25519SeedForCoin(seed, CoinFamily.XLM)) {
      const keyFromSeed = new HbarKeyPair({ seed: stellar.StrKey.decodeEd25519SecretSeed(seed) });
      const keys = keyFromSeed.getKeys();
      if (keys !== undefined && keys.prv) {
        return keys.prv;
      }
    }

    return null;
  }

  isValidPub(pub: string): boolean {
    return Utils.isValidPublicKey(pub);
  }

  public getTokenEnablementConfig(): TokenEnablementConfig {
    return {
      requiresTokenEnablement: true,
      supportsMultipleTokenEnablements: true,
    };
  }

  private getBuilderFactory(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }
}
