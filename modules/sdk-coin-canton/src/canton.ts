import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BitGoBase,
  KeyPair,
  MPCAlgorithm,
  MultisigType,
  multisigTypes,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  TransactionType,
  TssVerifyAddressOptions,
  VerifyTransactionOptions,
  TransactionExplanation as BaseTransactionExplanation,
  BaseTransaction,
} from '@bitgo/sdk-core';
import { auditEddsaPrivateKey } from '@bitgo/sdk-lib-mpc';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { TransactionBuilderFactory } from './lib';
import { KeyPair as CantonKeyPair } from './lib/keyPair';
import utils from './lib/utils';

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
}

export interface ExplainTransactionOptions {
  txHex: string;
}

export class Canton extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Canton(bitgo, staticsCoin);
  }

  private getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /** @inheritDoc */
  public getBaseFactor(): number {
    return 1e10;
  }

  /** @inheritDoc */
  public getChain(): string {
    return 'canton';
  }

  /** @inheritDoc */
  public getFamily(): string {
    return 'canton';
  }

  /** @inheritDoc */
  public getFullName(): string {
    return 'Canton';
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  /** inherited doc */
  requiresWalletInitializationTransaction(): boolean {
    return true;
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return 'eddsa';
  }

  /** @inheritDoc */
  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const coinConfig = coins.get(this.getChain());
    // extract `txParams` when verifying other transaction types
    const { txPrebuild: txPrebuild } = params;
    const rawTx = txPrebuild.txHex;
    if (!rawTx) {
      throw new Error('missing required tx prebuild property txHex');
    }
    const txBuilder = new TransactionBuilderFactory(coinConfig).from(rawTx);
    const transaction = txBuilder.transaction;
    switch (transaction.type) {
      case TransactionType.WalletInitialization: {
        // there is no input for this type of transaction, so always return true
        return true;
      }
      default: {
        throw new Error(`unknown transaction type, ${transaction.type}`);
      }
    }
  }

  /** @inheritDoc */
  isWalletAddress(params: TssVerifyAddressOptions): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new CantonKeyPair({ seed }) : new CantonKeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  /** @inheritDoc */
  explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    const factory = this.getBuilder();
    let rebuiltTransaction: BaseTransaction;
    const txRaw = params.txHex;
    try {
      const txBuilder = factory.from(txRaw);
      rebuiltTransaction = txBuilder.transaction;
    } catch (e) {
      throw new Error('Invalid transaction');
    }
    return rebuiltTransaction.explainTransaction();
  }

  /** @inheritDoc */
  isValidPub(pub: string): boolean {
    return utils.isValidPublicKey(pub);
  }

  /** @inheritDoc */
  isValidAddress(address: string): boolean {
    // canton addresses are of the form, partyHint::fingerprint
    // where partyHint is of length 5 and fingerprint is 68 characters long
    return utils.isValidAddress(address);
  }

  /** @inheritDoc */
  signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  auditDecryptedKey({ multiSigType, prv, publicKey }: AuditDecryptedKeyParams): void {
    if (multiSigType !== multisigTypes.tss) {
      throw new Error('Unsupported multiSigType');
    }
    auditEddsaPrivateKey(prv, publicKey ?? '');
  }
}
