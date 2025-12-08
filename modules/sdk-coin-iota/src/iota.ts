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
  TransactionRecipient,
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

/**
 * IOTA coin implementation.
 * Supports TSS (Threshold Signature Scheme) with EDDSA algorithm.
 */
export class Iota extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  /**
   * Factory method to create an IOTA coin instance.
   */
  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Iota(bitgo, staticsCoin);
  }

  // ========================================
  // Coin Configuration Methods
  // ========================================

  getBaseFactor(): string | number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
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

  // ========================================
  // Multi-Signature and TSS Support
  // ========================================

  supportsTss(): boolean {
    return true;
  }

  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return MPCType.EDDSA;
  }

  // ========================================
  // Address and Public Key Validation
  // ========================================

  /**
   * Validates an IOTA address.
   * @param address - The address to validate (64-character hex string)
   * @returns true if the address is valid
   */
  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address);
  }

  /**
   * Validates a public key.
   * @param pub - The public key to validate
   * @returns true if the public key is valid
   */
  isValidPub(pub: string): boolean {
    return utils.isValidPublicKey(pub);
  }

  /**
   * Verifies if an address belongs to a TSS wallet.
   * @param params - Verification parameters including wallet address and user/backup public keys
   * @returns true if the address belongs to the wallet
   */
  async isWalletAddress(params: TssVerifyAddressOptions): Promise<boolean> {
    return verifyEddsaTssWalletAddress(
      params,
      (address) => this.isValidAddress(address),
      (publicKey) => utils.getAddressFromPublicKey(publicKey)
    );
  }

  // ========================================
  // Transaction Explanation and Verification
  // ========================================

  /**
   * Explains a transaction by parsing its hex representation.
   * @param params - Parameters containing the transaction hex
   * @returns Detailed explanation of the transaction
   * @throws Error if txHex is missing or transaction cannot be explained
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    const rawTx = this.validateAndExtractTxHex(params.txHex, 'explain');
    const transaction = await this.rebuildTransaction(rawTx);
    return transaction.explainTransaction();
  }

  /**
   * Verifies that a transaction prebuild matches the original transaction parameters.
   * Ensures recipients and amounts align with the intended transaction.
   *
   * @param params - Verification parameters containing prebuild and original params
   * @returns true if verification succeeds
   * @throws Error if verification fails
   */
  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const { txPrebuild, txParams } = params;
    const rawTx = this.validateAndExtractTxHex(txPrebuild.txHex, 'verify');

    const transaction = await this.rebuildTransaction(rawTx);
    this.validateTransactionType(transaction);

    if (txParams.recipients !== undefined) {
      this.verifyTransactionRecipients(transaction as TransferTransaction, txParams.recipients);
    }

    return true;
  }

  /**
   * Parses a transaction and extracts inputs, outputs, and fees.
   * @param params - Parameters containing the transaction hex
   * @returns Parsed transaction with inputs, outputs, and fee information
   */
  async parseTransaction(params: IotaParseTransactionOptions): Promise<ParsedTransaction> {
    const transactionExplanation = await this.explainTransaction({ txHex: params.txHex });

    if (!transactionExplanation || transactionExplanation.outputs.length === 0) {
      return this.createEmptyParsedTransaction();
    }

    const fee = this.calculateTransactionFee(transactionExplanation);
    const inputs = this.buildTransactionInputs(transactionExplanation, fee);
    const outputs = this.buildTransactionOutputs(transactionExplanation);

    return { inputs, outputs, fee };
  }

  // ========================================
  // Key Generation and Signing
  // ========================================

  /**
   * Generates a key pair for IOTA transactions.
   * @param seed - Optional seed to generate deterministic key pair
   * @returns Key pair with public and private keys
   * @throws Error if private key generation fails
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
   * Signs a transaction (not implemented for IOTA).
   * IOTA transactions are signed externally using TSS.
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  /**
   * Audits a decrypted private key to ensure it's valid for the given public key.
   * @param params - Parameters containing multiSigType, private key, and public key
   * @throws Error if multiSigType is not TSS or if key validation fails
   */
  auditDecryptedKey({ multiSigType, prv, publicKey }: AuditDecryptedKeyParams): void {
    if (multiSigType !== multisigTypes.tss) {
      throw new Error('Unsupported multiSigType');
    }
    auditEddsaPrivateKey(prv, publicKey ?? '');
  }

  /**
   * Extracts the signable payload from a serialized transaction.
   * @param serializedTx - The serialized transaction hex
   * @returns Buffer containing the signable payload
   */
  async getSignablePayload(serializedTx: string): Promise<Buffer> {
    const rebuiltTransaction = await this.rebuildTransaction(serializedTx);
    return rebuiltTransaction.signablePayload;
  }

  /**
   * Sets coin-specific fields in the transaction intent.
   * @param intent - The populated intent object to modify
   * @param params - Parameters containing unspents data
   */
  setCoinSpecificFieldsInIntent(intent: PopulatedIntent, params: PrebuildTransactionWithIntentOptions): void {
    intent.unspents = params.unspents;
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Validates and extracts transaction hex from parameters.
   * @param txHex - The transaction hex to validate
   * @param operation - The operation being performed (for error messages)
   * @returns The validated transaction hex
   * @throws Error if txHex is missing
   */
  private validateAndExtractTxHex(txHex: string | undefined, operation: string): string {
    if (!txHex) {
      throw new Error(`missing required tx prebuild property txHex for ${operation} operation`);
    }
    return txHex;
  }

  /**
   * Validates that the transaction is a TransferTransaction.
   * @param transaction - The transaction to validate
   * @throws Error if transaction is not a TransferTransaction
   */
  private validateTransactionType(transaction: Transaction): void {
    if (!(transaction instanceof TransferTransaction)) {
      throw new Error('Tx not a transfer transaction');
    }
  }

  /**
   * Verifies that transaction recipients match the expected recipients.
   * @param transaction - The transfer transaction to verify
   * @param expectedRecipients - The expected recipients from transaction params
   * @throws Error if recipients don't match
   */
  private verifyTransactionRecipients(
    transaction: TransferTransaction,
    expectedRecipients: TransactionRecipient[]
  ): void {
    const txData = transaction.toJson() as TransferTxData;

    if (!txData.recipients) {
      throw new Error('Tx recipients does not match with expected txParams recipients');
    }

    const actualRecipients = this.normalizeRecipients(txData.recipients);
    const expected = this.normalizeRecipients(expectedRecipients);

    if (!this.recipientsMatch(expected, actualRecipients)) {
      throw new Error('Tx recipients does not match with expected txParams recipients');
    }
  }

  /**
   * Normalizes recipients by extracting only relevant fields.
   * @param recipients - Recipients to normalize
   * @returns Normalized recipients with address, amount, and tokenName only
   */
  private normalizeRecipients(recipients: TransactionRecipient[]): TransactionRecipient[] {
    return recipients.map((recipient) => _.pick(recipient, ['address', 'amount', 'tokenName']));
  }

  /**
   * Checks if expected recipients match actual recipients.
   * @param expected - Expected recipients
   * @param actual - Actual recipients from transaction
   * @returns true if all expected recipients are found in actual recipients
   */
  private recipientsMatch(expected: TransactionRecipient[], actual: TransactionRecipient[]): boolean {
    return expected.every((expectedRecipient) =>
      actual.some((actualRecipient) => _.isEqual(expectedRecipient, actualRecipient))
    );
  }

  /**
   * Creates an empty parsed transaction result.
   * Used when transaction has no outputs.
   */
  private createEmptyParsedTransaction(): ParsedTransaction {
    return {
      inputs: [],
      outputs: [],
      fee: new BigNumber(0),
    };
  }

  /**
   * Calculates the transaction fee from the explanation.
   * @param explanation - The transaction explanation
   * @returns The fee as a BigNumber
   */
  private calculateTransactionFee(explanation: TransactionExplanation): BigNumber {
    if (explanation.fee.fee === '') {
      return new BigNumber(0);
    }
    return new BigNumber(explanation.fee.fee);
  }

  /**
   * Builds the inputs array for a parsed transaction.
   * Includes sender input and optionally sponsor input if present.
   *
   * @param explanation - The transaction explanation
   * @param fee - The calculated transaction fee
   * @returns Array of transaction inputs
   */
  private buildTransactionInputs(
    explanation: TransactionExplanation,
    fee: BigNumber
  ): Array<{
    address: string;
    amount: string;
  }> {
    const senderAddress = explanation.outputs[0].address;
    const outputAmount = new BigNumber(explanation.outputAmount);

    // If there's a sponsor, sender only pays for outputs
    // Otherwise, sender pays for outputs + fee
    const senderAmount = explanation.sponsor ? outputAmount.toFixed() : outputAmount.plus(fee).toFixed();

    const inputs = [
      {
        address: senderAddress,
        amount: senderAmount,
      },
    ];

    // Add sponsor input if present
    if (explanation.sponsor) {
      inputs.push({
        address: explanation.sponsor,
        amount: fee.toFixed(),
      });
    }

    return inputs;
  }

  /**
   * Builds the outputs array for a parsed transaction.
   * @param explanation - The transaction explanation
   * @returns Array of transaction outputs
   */
  private buildTransactionOutputs(explanation: TransactionExplanation): Array<{
    address: string;
    amount: string;
  }> {
    return explanation.outputs.map((output) => ({
      address: output.address,
      amount: new BigNumber(output.amount).toFixed(),
    }));
  }

  /**
   * Creates a transaction builder factory instance.
   * @returns TransactionBuilderFactory for this coin
   */
  private getTxBuilderFactory(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /**
   * Rebuilds a transaction from its hex representation.
   * @param txHex - The transaction hex to rebuild
   * @returns The rebuilt transaction
   * @throws Error if transaction cannot be rebuilt
   */
  private async rebuildTransaction(txHex: string): Promise<Transaction> {
    const txBuilderFactory = this.getTxBuilderFactory();
    try {
      const txBuilder = txBuilderFactory.from(txHex);
      return (await txBuilder.build()) as Transaction;
    } catch (err) {
      throw new Error(`Failed to rebuild transaction: ${err.toString()}`);
    }
  }
}
