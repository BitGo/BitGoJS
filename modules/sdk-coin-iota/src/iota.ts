import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BitGoBase,
  KeyPair,
  ParsedTransaction,
  SignTransactionOptions,
  SignedTransaction,
  VerifyTransactionOptions,
  MultisigType,
  multisigTypes,
  MPCAlgorithm,
  TssVerifyAddressOptions,
  MPCType,
  PopulatedIntent,
  PrebuildTransactionWithIntentOptions,
  verifyEddsaTssWalletAddress,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import utils from './lib/utils';
import { KeyPair as IotaKeyPair, Transaction, TransactionBuilderFactory } from './lib';
import { auditEddsaPrivateKey } from '@bitgo/sdk-lib-mpc';
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import {
  ExplainTransactionOptions,
  IotaParseTransactionOptions,
  TransactionExplanation,
  TransferTxData,
} from './lib/iface';
import { TransferTransaction } from './lib/transferTransaction';

export class Iota extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Iota(bitgo, staticsCoin);
  }

  getBaseFactor(): string | number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
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

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return MPCType.EDDSA;
  }

  /**
   * Check if an address is valid
   * @param address the address to be validated
   * @returns true if the address is valid
   */
  isValidAddress(address: string): boolean {
    // IOTA addresses are 64-character hex strings
    return utils.isValidAddress(address);
  }

  /**
   * @inheritDoc
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    const rawTx = params.txBase64;
    if (!rawTx) {
      throw new Error('missing required tx prebuild property txBase64');
    }
    const transaction = await this.rebuildTransaction(rawTx);
    if (!transaction) {
      throw new Error('failed to explain transaction');
    }
    return transaction.explainTransaction();
  }

  /**
   * Verifies that a transaction prebuild complies with the original intention
   * @param params
   */
  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const { txPrebuild: txPrebuild, txParams: txParams } = params;
    const rawTx = txPrebuild.txBase64;
    if (!rawTx) {
      throw new Error('missing required tx prebuild property txBase64');
    }
    const transaction = await this.rebuildTransaction(rawTx);
    if (!transaction) {
      throw new Error('failed to verify transaction');
    }
    if (txParams.recipients !== undefined) {
      if (!(transaction instanceof TransferTransaction)) {
        throw new Error('Tx not a transfer transaction');
      }
      const txData = transaction.toJson() as TransferTxData;
      if (!txData.recipients || !_.isEqual(txParams.recipients, txData.recipients)) {
        throw new Error('Tx recipients does not match with expected txParams recipients');
      }
    }
    return true;
  }

  /**
   * Check if an address belongs to a wallet
   * @param params
   */
  async isWalletAddress(params: TssVerifyAddressOptions): Promise<boolean> {
    return verifyEddsaTssWalletAddress(
      params,
      (address) => this.isValidAddress(address),
      (publicKey) => utils.getAddressFromPublicKey(publicKey)
    );
  }

  /**
   * Parse a transaction
   * @param params
   */
  async parseTransaction(params: IotaParseTransactionOptions): Promise<ParsedTransaction> {
    const transactionExplanation = await this.explainTransaction({ txBase64: params.txBase64 });

    if (!transactionExplanation) {
      throw new Error('Invalid transaction');
    }

    let fee = new BigNumber(0);

    if (transactionExplanation.outputs.length <= 0) {
      return {
        inputs: [],
        outputs: [],
        fee,
      };
    }

    const senderAddress = transactionExplanation.outputs[0].address;
    if (transactionExplanation.fee.fee !== '') {
      fee = new BigNumber(transactionExplanation.fee.fee);
    }

    const outputAmount = transactionExplanation.sponsor
      ? new BigNumber(transactionExplanation.outputAmount).toFixed()
      : new BigNumber(transactionExplanation.outputAmount).plus(fee).toFixed(); // assume 1 sender, who is also the fee payer

    const inputs = [
      {
        address: senderAddress,
        amount: outputAmount,
      },
    ];
    if (transactionExplanation.sponsor) {
      inputs.push({
        address: transactionExplanation.sponsor,
        amount: fee.toFixed(),
      });
    }

    const outputs: {
      address: string;
      amount: string;
    }[] = transactionExplanation.outputs.map((output) => {
      return {
        address: output.address,
        amount: new BigNumber(output.amount).toFixed(),
      };
    });

    return {
      inputs,
      outputs,
      fee,
    };
  }

  /**
   * Generate a key pair
   * @param seed Optional seed to generate key pair from
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new IotaKeyPair({ seed }) : new IotaKeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  /**
   * Check if a public key is valid
   * @param pub Public key to check
   */
  isValidPub(pub: string): boolean {
    return utils.isValidPublicKey(pub);
  }

  /**
   * Sign a transaction
   * @param params
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  /**
   * Audit a decrypted private key to ensure it's valid
   * @param params
   */
  auditDecryptedKey({ multiSigType, prv, publicKey }: AuditDecryptedKeyParams): void {
    if (multiSigType !== multisigTypes.tss) {
      throw new Error('Unsupported multiSigType');
    }
    auditEddsaPrivateKey(prv, publicKey ?? '');
  }

  /** @inheritDoc */
  async getSignablePayload(serializedTx: string): Promise<Buffer> {
    const rebuiltTransaction = await this.rebuildTransaction(serializedTx);
    return rebuiltTransaction.signablePayload;
  }

  /** inherited doc */
  setCoinSpecificFieldsInIntent(intent: PopulatedIntent, params: PrebuildTransactionWithIntentOptions): void {
    intent.unspents = params.unspents;
  }

  private getTxBuilderFactory(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  private async rebuildTransaction(txHex: string): Promise<Transaction> {
    const txBuilderFactory = this.getTxBuilderFactory();
    try {
      const txBuilder = txBuilderFactory.from(txHex);
      txBuilder.transaction.isSimulateTx = false;
      return (await txBuilder.build()) as Transaction;
    } catch {
      throw new Error('Failed to rebuild transaction');
    }
  }
}
