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
  VerifyTransactionOptions,
  TransactionExplanation as BaseTransactionExplanation,
  BaseTransaction,
  PopulatedIntent,
  PrebuildTransactionWithIntentOptions,
  TssVerifyAddressOptions,
  InvalidAddressError,
  extractCommonKeychain,
  EDDSAMethods,
  TokenEnablementConfig,
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
    const { txPrebuild: txPrebuild, txParams } = params;
    const rawTx = txPrebuild.txHex;
    if (!rawTx) {
      throw new Error('missing required tx prebuild property txHex');
    }
    const txBuilder = new TransactionBuilderFactory(coinConfig).from(rawTx);
    const transaction = txBuilder.transaction;
    const explainedTx = transaction.explainTransaction();
    switch (transaction.type) {
      case TransactionType.WalletInitialization:
      case TransactionType.TransferAccept:
      case TransactionType.TransferReject:
      case TransactionType.TransferAcknowledge:
      case TransactionType.OneStepPreApproval:
        // There is no input for these type of transactions, so always return true.
        return true;
      case TransactionType.Send:
        if (txParams.recipients !== undefined) {
          const filteredRecipients = txParams.recipients?.map((recipient) => {
            const { address, amount } = recipient;
            const [addressPart, memoId] = address.split('?memoId=');
            if (memoId) {
              return { address: addressPart, amount, memo: memoId };
            }
            return { address, amount };
          });
          const filteredOutputs = explainedTx.outputs?.map((output) => {
            const { address, amount, memo } = output;
            if (memo) {
              return { address, amount, memo };
            }
            return { address, amount };
          });
          if (JSON.stringify(filteredRecipients) !== JSON.stringify(filteredOutputs)) {
            throw new Error('Tx outputs do not match with expected txParams recipients');
          }
        }
        return true;
      default: {
        throw new Error(`unknown transaction type, ${transaction.type}`);
      }
    }
  }

  /** @inheritDoc */
  async isWalletAddress(params: TssVerifyAddressOptions): Promise<boolean> {
    // TODO: refactor this and use the `verifyEddsaMemoBasedWalletAddress` once published from sdk-core
    // https://bitgoinc.atlassian.net/browse/COIN-6347
    const { keychains, address: newAddress, index } = params;
    const [addressPart, memoId] = newAddress.split('?memoId=');
    if (!this.isValidAddress(addressPart)) {
      throw new InvalidAddressError(`invalid address: ${newAddress}`);
    }
    if (memoId && memoId !== `${index}`) {
      throw new InvalidAddressError(`invalid memoId index: ${memoId}`);
    }
    const commonKeychain = extractCommonKeychain(keychains);
    const MPC = await EDDSAMethods.getInitializedMpcInstance();
    const derivationPath = 'm/0';
    const derivedPublicKey = MPC.deriveUnhardened(commonKeychain, derivationPath).slice(0, 64);
    const publicKeyBase64 = Buffer.from(derivedPublicKey, 'hex').toString('base64');
    const rootAddressFingerprint = utils.getAddressFromPublicKey(publicKeyBase64);
    const rootAddress = `${rootAddressFingerprint.slice(0, 5)}::${rootAddressFingerprint}`;
    return addressPart === rootAddress;
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
  getTokenEnablementConfig(): TokenEnablementConfig {
    return {
      requiresTokenEnablement: true,
      supportsMultipleTokenEnablements: false,
    };
  }

  getAddressFromPublicKey(publicKeyHex: string): string {
    const publicKeyBase64 = Buffer.from(publicKeyHex, 'hex').toString('base64');
    return utils.getAddressFromPublicKey(publicKeyBase64);
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

  /** @inheritDoc */
  setCoinSpecificFieldsInIntent(intent: PopulatedIntent, params: PrebuildTransactionWithIntentOptions): void {
    if (params.txRequestId) {
      intent.txRequestId = params.txRequestId;
    }
  }
}
