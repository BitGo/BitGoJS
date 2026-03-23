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
import * as querystring from 'querystring';
import { TransactionBuilderFactory } from './lib';
import { KeyPair as CantonKeyPair } from './lib/keyPair';
import utils from './lib/utils';
import { WalletInitBroadcastData, TransactionBroadcastData } from './lib/iface';

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
}

export interface ExplainTransactionOptions {
  txHex: string;
}

interface AddressDetails {
  address: string;
  memoId?: string;
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

  /**
   * Returns the extended payload that needs to be signed for Canton EdDSA operations.
   * Canton requires signing a structured payload containing transaction metadata and signable hash,
   * not just the serialized transaction.
   *
   * @param {string} serializedTx - the unsigned transaction in broadcast format (base64)
   * @returns {Promise<Buffer>} - the extended payload (topology + hash, or prepared tx + hash)
   */
  async getSignablePayload(serializedTx: string): Promise<Buffer> {
    try {
      // Decode the serialized transaction
      const decoded = JSON.parse(Buffer.from(serializedTx, 'base64').toString('utf8')) as
        | WalletInitBroadcastData
        | TransactionBroadcastData;

      // Extract the signable payload (preparedTransactionHash in base64 format)
      let signableHex = '';
      if ('prepareCommandResponse' in decoded && decoded.prepareCommandResponse) {
        signableHex = Buffer.from(decoded.prepareCommandResponse.preparedTransactionHash, 'base64').toString('hex');
      } else {
        // Fallback: if unable to extract, return empty buffer
        signableHex = '';
      }

      // Build extended payload based on transaction type
      if ('preparedParty' in decoded && decoded.preparedParty && decoded.preparedParty.topologyTransactions) {
        // WalletInitBuilder format: [txnType] || itemCount || [lenOfTx || tx]... || signableHex
        return this.buildWalletInitPayload(decoded as WalletInitBroadcastData, signableHex);
      }

      // TransactionBuilder format: itemCount || lenOfTx || preparedTransaction || signableHex
      if ('prepareCommandResponse' in decoded && decoded.prepareCommandResponse?.preparedTransaction) {
        return this.buildTransactionPayload(decoded as TransactionBroadcastData, signableHex);
      }

      // Fallback: return signableHex only if no extended format detected
      return Buffer.from(signableHex, 'hex');
    } catch (e) {
      // If parsing fails, fall back to base implementation
      return Buffer.from(serializedTx);
    }
  }

  /**
   * Build WalletInitBuilder extended payload format.
   * Format: [txnType (optional)] || itemCount (4 bytes LE) || [lenOfTx (4 bytes LE) || tx]... || signableHex
   */
  private buildWalletInitPayload(decoded: WalletInitBroadcastData, signableHex: string): Buffer {
    const shouldIncludeTxnType = decoded.preparedParty.shouldIncludeTxnType ?? false;
    const topologyTransactions = decoded.preparedParty.topologyTransactions;
    const itemCount = topologyTransactions.length + 1;

    const parts: Buffer[] = [];

    // Add txnType if required (version >0.5.x)
    if (shouldIncludeTxnType) {
      const txnTypeBuff = Buffer.alloc(4);
      txnTypeBuff.writeUInt32LE(0, 0);
      parts.push(txnTypeBuff);
    }

    // Add item count
    const itemCountBuff = Buffer.alloc(4);
    itemCountBuff.writeUInt32LE(itemCount, 0);
    parts.push(itemCountBuff);

    // Add topology transactions with length prefixes
    for (const tx of topologyTransactions) {
      const txBuffer = Buffer.from(tx, 'base64');
      const lenBuff = Buffer.alloc(4);
      lenBuff.writeUInt32LE(txBuffer.length, 0);
      parts.push(lenBuff, txBuffer);
    }

    // Add signable hash
    parts.push(Buffer.from(signableHex, 'hex'));

    return Buffer.concat(parts);
  }

  /**
   * Build TransactionBuilder extended payload format.
   * Format: itemCount (4 bytes LE) || lenOfTx (4 bytes LE) || preparedTransaction || signableHex
   */
  private buildTransactionPayload(decoded: TransactionBroadcastData, signableHex: string): Buffer {
    const preparedTx = decoded.prepareCommandResponse?.preparedTransaction;
    if (!preparedTx) {
      return Buffer.from(signableHex, 'hex');
    }

    const preparedTxBuffer = Buffer.from(preparedTx, 'base64');
    const itemCount = 2; // prepared transaction & signable payload

    const itemCountBuff = Buffer.alloc(4);
    itemCountBuff.writeUInt32LE(itemCount, 0);

    const lenBuff = Buffer.alloc(4);
    lenBuff.writeUInt32LE(preparedTxBuffer.length, 0);

    return Buffer.concat([itemCountBuff, lenBuff, preparedTxBuffer, Buffer.from(signableHex, 'hex')]);
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
      case TransactionType.TransferOfferWithdrawn:
        // There is no input for these type of transactions, so always return true.
        return true;
      case TransactionType.Send:
        if (txParams.recipients !== undefined) {
          const filteredRecipients = txParams.recipients?.map((recipient) => {
            const { amount, tokenName } = recipient;
            const { address, memoId } = this.getAddressDetails(recipient.address);
            return {
              address,
              amount,
              ...(memoId && { memo: memoId }),
              ...(tokenName && { tokenName }),
            };
          });
          const filteredOutputs = explainedTx.outputs?.map((output) => {
            const { address, amount, tokenName, memo } = output;
            return {
              address,
              amount,
              ...(memo && { memo }),
              ...(tokenName && { tokenName }),
            };
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
    const { address: addressPart, memoId } = this.getAddressDetails(newAddress);
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

  /**
   * Process address into address and optional memo id
   *
   * @param address the address
   * @returns object containing base address and optional memo id
   */
  getAddressDetails(address: string): AddressDetails {
    const queryIndex = address.indexOf('?');
    const destinationAddress = queryIndex >= 0 ? address.slice(0, queryIndex) : address;
    const query = queryIndex >= 0 ? address.slice(queryIndex + 1) : undefined;

    // Address without memoId query parameter.
    if (query === undefined) {
      return {
        address,
        memoId: undefined,
      };
    }

    if (!query || destinationAddress.length === 0) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    const queryDetails = querystring.parse(query);
    if (!queryDetails.memoId) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    if (Array.isArray(queryDetails.memoId)) {
      throw new InvalidAddressError(
        `memoId may only be given at most once, but found ${queryDetails.memoId.length} instances in address ${address}`
      );
    }

    const queryKeys = Object.keys(queryDetails);
    if (queryKeys.length !== 1) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    const [memoId] = [queryDetails.memoId].filter((value): value is string => typeof value === 'string');
    if (!memoId || memoId.trim().length === 0) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    return {
      address: destinationAddress,
      memoId,
    };
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
    if (params.transferOfferId) {
      intent.transferOfferId = params.transferOfferId;
    }
  }
}
