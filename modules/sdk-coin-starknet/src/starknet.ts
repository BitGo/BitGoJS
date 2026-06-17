import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BitGoBase,
  InvalidAddressError,
  KeyPair,
  MethodNotImplementedError,
  MPCAlgorithm,
  MultisigType,
  multisigTypes,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  VerifyTransactionOptions,
  verifyMPCWalletAddress,
  UnexpectedAddressError,
} from '@bitgo/sdk-core';
import { coins, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { createHash, Hash } from 'crypto';

import { StarknetTransactionExplanation, TransactionHexParams, TssVerifyStarknetAddressOptions } from './lib/iface';
import { TransactionBuilderFactory } from './lib/transactionBuilderFactory';
import utils from './lib/utils';
import { auditEcdsaPrivateKey } from '@bitgo/sdk-lib-mpc';

export class Starknet extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Starknet(bitgo, staticsCoin);
  }

  getChain(): string {
    return this._staticsCoin.name;
  }

  getBaseChain(): string {
    return this._staticsCoin.name;
  }

  getFamily(): string {
    return this._staticsCoin.family;
  }

  getFullName(): string {
    return this._staticsCoin.fullName;
  }

  getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  async explainTransaction(params: TransactionHexParams): Promise<StarknetTransactionExplanation> {
    const factory = this.getBuilderFactory();
    const txBuilder = await factory.from(params.transactionHex);
    const transaction = await txBuilder.build();
    return transaction.explainTransaction();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const { txParams, txPrebuild } = params;
    const txHex = txPrebuild?.txHex;
    if (!txHex) {
      throw new Error('txHex is required');
    }

    const explainedTx = await this.explainTransaction({ transactionHex: txHex });

    if (Array.isArray(txParams.recipients) && txParams.recipients.length > 0) {
      if (txParams.recipients.length > 1) {
        throw new Error(
          `${this.getChain()} doesn't support sending to more than 1 destination address within a single transaction. Try again, using only a single recipient.`
        );
      }

      if (explainedTx.outputs.length !== 1) {
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }

      const output = explainedTx.outputs[0];
      const recipient = txParams.recipients[0];
      const normalizedOutput = utils.normalizeAddress(output.address);
      const normalizedRecipient = utils.normalizeAddress(recipient.address);
      if (normalizedOutput !== normalizedRecipient || output.amount !== recipient.amount) {
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }
    }
    return true;
  }

  async isWalletAddress(params: TssVerifyStarknetAddressOptions): Promise<boolean> {
    const { address } = params;

    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    const result = await verifyMPCWalletAddress(
      { ...params, keyCurve: 'secp256k1' },
      this.isValidAddress.bind(this),
      (pubKey) => utils.getAddressFromPublicKey(pubKey)
    );

    if (!result) {
      throw new UnexpectedAddressError(`address validation failure: address ${address} is not a wallet address`);
    }

    return true;
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  public generateKeyPair(seed?: Buffer): KeyPair {
    return utils.generateKeyPair(seed);
  }

  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address);
  }

  // Starknet is TSS-only; signing is handled by threshold ECDSA in wallet-platform/OVC.
  async signTransaction(_params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new MethodNotImplementedError('signTransaction');
  }

  isValidPub(key: string): boolean {
    return utils.isValidPublicKey(key);
  }

  isValidPrv(key: string): boolean {
    return utils.isValidPrivateKey(key);
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  /** @inheritDoc */
  requiresWalletInitializationTransaction(): boolean {
    return true;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  /** @inheritDoc **/
  getHashFunction(): Hash {
    return createHash('sha256');
  }

  private getBuilderFactory(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getBaseChain()));
  }

  /** @inheritDoc */
  auditDecryptedKey({ multiSigType, prv, publicKey }: AuditDecryptedKeyParams): void {
    if (multiSigType !== 'tss') {
      throw new Error('Unsupported multisigtype');
    }
    auditEcdsaPrivateKey(prv as string, publicKey as string);
  }
}
