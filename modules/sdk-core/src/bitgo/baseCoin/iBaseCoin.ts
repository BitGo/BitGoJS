import BigNumber from 'bignumber.js';
import { BaseCoin as StaticsBaseCoin, BaseTokenConfig } from '@bitgo/statics';
import { IRequestTracer } from '../../api';
import { IEnterprises } from '../enterprise';
import { IKeychains, Keychain } from '../keychain';
import { IMarkets } from '../market';
import { IPendingApprovals } from '../pendingApproval';
import { InitiateRecoveryOptions } from '../recovery';
import { EcdsaMPCv2Utils, EcdsaUtils } from '../utils/tss/ecdsa';
import EddsaUtils, { PrebuildTransactionWithIntentOptions, TxRequest } from '../utils/tss/eddsa';
import { CreateAddressFormat, CustomSigningFunction, IWallet, IWallets, Wallet, WalletData, Memo } from '../wallet';

import { IWebhooks } from '../webhook/iWebhooks';
import { MessageStandardType, TransactionType } from '../../account-lib';
import { IInscriptionBuilder } from '../inscriptionBuilder';
import { Hash } from 'crypto';
import { MPCTx, PopulatedIntent, TokenType } from '../utils';

export const multisigTypes = {
  onchain: 'onchain',
  tss: 'tss',
} as const;

export type MultisigType = keyof typeof multisigTypes;

export interface Output extends ITransactionRecipient {
  address: string;
  // of form coin:token
  coinName?: string;
  isPayGo?: boolean;
  value?: number;
  wallet?: string; // Types.ObjectId;
  walletV1?: string; // Types.ObjectId;
  baseAddress?: string;
  enterprise?: string; // Types.ObjectId;
  valueString: string;
  data?: string;
  // "change" is a utxo-specific concept and this property should
  // be removed once it it's usage is refactored out of base coin logic
  change?: boolean;
}

export type Input = {
  derivationIndex?: number;
  value: number;
  address?: string;
  valueString: string;
  // the properties below are utxo-related but are currently used in abstractBaseCoin
  // these should be removed once their usage is removed from the base coin class
  chain?: number;
  index?: number;
};

export type UnsignedTransaction = {
  // unsigned transaction in broadcast format
  serializedTxHex: string;
  // portion of a transaction used to generate a signature
  signableHex: string;
  // transaction fees
  feeInfo?: {
    fee: number | BigNumber;
    feeString: string;
  };
  // derivation path of the signer
  derivationPath: string;
  coinSpecific?: Record<string, unknown>;
  entryValues: any;
  parsedTx: UnsignedParsedTransaction;
};

export interface ExplanationResult extends ITransactionExplanation {
  sequenceId: number;
  type?: string;
  outputs: Output[];
  blockNumber: number | unknown;
}

export interface ITransactionRecipient {
  address: string;
  amount: string | number;
  tokenName?: string;
  memo?: string;
}

export interface ITransactionFee<TAmount = string> {
  fee: TAmount;
  feeRate?: number;
  size?: number;
}

export type AuditKeyParams = { prv?: string; encryptedPrv?: string; walletPassphrase?: string } & (
  | { prv: string }
  | { encryptedPrv: string; walletPassphrase: string }
) &
  (
    | {
        multiSigType: 'tss';
        publicKey: string;
      }
    | {
        multiSigType?: 'onchain';
        publicKey?: string;
      }
  );

export type AuditDecryptedKeyParams = Omit<AuditKeyParams, 'encryptedPrv' | 'walletPassphrase'> & { prv: string };

export interface ITransactionExplanation<TFee = any, TAmount = any> {
  /** @deprecated */
  displayOrder?: string[];
  id: string;
  /** NOTE: External recipients */
  outputs: ITransactionRecipient[];
  /** NOTE: External amount */
  outputAmount: TAmount;
  changeOutputs: ITransactionRecipient[];
  changeAmount: TAmount;
  fee: TFee;
  proxy?: string;
  producers?: string[];
}

export interface KeyPair {
  pub?: string;
  prv: string;
}

export interface IBlsKeyPair extends KeyPair {
  secretShares?: string[];
  chaincode: string;
  seed?: string;
}

export interface VerifyAddressOptions {
  format?: CreateAddressFormat;
  address: string;
  addressType?: string;
  keychains?: {
    pub: string;
    commonKeychain?: string;
  }[];
  error?: string;
  coinSpecific?: AddressCoinSpecific;
  impliedForwarderVersion?: number;
}

export interface TssVerifyAddressOptions extends VerifyAddressOptions {
  chain: string;
  index: string;
}

export interface TransactionParams {
  recipients?: ITransactionRecipient[];
  walletPassphrase?: string;
  type?: string;
  memo?: Memo;
}

export interface AddressVerificationData {
  coinSpecific?: AddressCoinSpecific;
  chain?: number;
  index?: number;
}

export interface VerificationOptions {
  disableNetworking?: boolean;
  keychains?: {
    user?: Keychain;
    backup?: Keychain;
    bitgo?: Keychain;
  };
  addresses?: { [address: string]: AddressVerificationData };
  allowPaygoOutput?: boolean;
  considerMigratedFromAddressInternal?: boolean;
}

export interface VerifyTransactionOptions {
  txPrebuild: TransactionPrebuild;
  txParams: TransactionParams;
  wallet: IWallet;
  verification?: VerificationOptions;
  reqId?: IRequestTracer;
  walletType?: 'onchain' | 'tss';
}

export interface SupplementGenerateWalletOptions {
  label: string;
  m?: number;
  n?: number;
  enterprise?: string;
  disableTransactionNotifications?: boolean;
  gasPrice?: number | string;
  eip1559?: {
    maxFeePerGas: number | string;
    maxPriorityFeePerGas?: number | string;
  };
  walletVersion?: number;
  keys?: string[];
  keySignatures?: {
    backup: string;
    bitgo: string;
  };
  rootPrivateKey?: string;
  disableKRSEmail?: boolean;
  multisigType?: 'tss' | 'onchain' | 'blsdkg';
  type: 'hot' | 'cold' | 'custodial';
  subType?: 'lightningCustody' | 'lightningSelfCustody' | 'onPrem';
  coinSpecific?: { [coinName: string]: unknown };
}

export interface FeeEstimateOptions {
  numBlocks?: number;
  hop?: boolean;
  recipient?: string;
  data?: string;
  amount?: string;
  type?: keyof typeof TransactionType;
}

// TODO (SDKT-9): reverse engineer and add options
export interface ExtraPrebuildParamsOptions {
  [index: string]: unknown;
}

// TODO (SDKT-9): reverse engineer and add options
export interface PresignTransactionOptions {
  txPrebuild?: TransactionPrebuild;
  walletData: WalletData;
  tssUtils: EcdsaUtils | EcdsaMPCv2Utils | EddsaUtils | undefined;
  [index: string]: unknown;
}

// TODO (SDKT-9): reverse engineer and add options
export interface PrecreateBitGoOptions {
  [index: string]: unknown;
}

// TODO (SDKT-9): reverse engineer and add options
export interface VerifyRecoveryTransactionOptions {
  [index: string]: unknown;
}

// TODO (SDKT-9): reverse engineer and add options
export interface ParseTransactionOptions {
  [index: string]: unknown;
}

// TODO (SDKT-9): reverse engineer and add options
export interface ParsedTransaction {
  [index: string]: unknown;
}

// TODO (SDKT-9): reverse engineer and add options
export type UnsignedParsedTransaction = {
  inputs: Input[];
  minerFee: number | string;
  outputs: Output[];
  spendAmount: number | string;
  hasUnvalidatedData?: boolean;
  payGoFee?: number;
  type?: string;
  sequenceId: number;
  id: string;
};

// TODO (SDKT-9): reverse engineer and add options
export interface SignTransactionOptions {
  [index: string]: unknown;
}

export interface KeychainsTriplet {
  userKeychain: Keychain;
  backupKeychain: Keychain;
  bitgoKeychain: Keychain;
}

export interface LightningKeychainsTriplet {
  userKeychain: Keychain;
  userAuthKeychain: Keychain;
  nodeAuthKeychain: Keychain;
}

interface BuildParams {
  preview?: boolean;
  recipients?: ITransactionRecipient[];
}

interface BaseSignable {
  wallet?: IWallet;
  buildParams?: BuildParams & Partial<any>;
  consolidateId?: string;
  txRequestId?: string;
}

export interface TransactionPrebuild extends BaseSignable {
  txBase64?: string;
  txHex?: string;
  txInfo?: unknown;
}

export interface Message extends BaseSignable {
  messageRaw: string;
  messageEncoded?: string;
  messageStandardType?: MessageStandardType;
}

export interface MessageTypeProperty {
  name: string;
  type: string;
}
export interface MessageTypes {
  EIP712Domain: MessageTypeProperty[];
  [additionalProperties: string]: MessageTypeProperty[];
}

export enum SignTypedDataVersion {
  V1 = 'V1',
  V3 = 'V3',
  V4 = 'V4',
}

/**
 * This is the message format used for `signTypeData`, for all versions
 * except `V1`.
 *
 * @template T - The custom types used by this message.
 * @property types - The custom types used by this message.
 * @property primaryType - The type of the message.
 * @property domain - Signing domain metadata. The signing domain is the intended context for the
 * signature (e.g. the dapp, protocol, etc. that it's intended for). This data is used to
 * construct the domain seperator of the message.
 * @property domain.name - The name of the signing domain.
 * @property domain.version - The current major version of the signing domain.
 * @property domain.chainId - The chain ID of the signing domain.
 * @property domain.verifyingContract - The address of the contract that can verify the signature.
 * @property domain.salt - A disambiguating salt for the protocol.
 * @property message - The message to be signed.
 */
export interface TypedMessage<T extends MessageTypes> {
  types: T;
  primaryType: keyof T;
  domain: {
    name?: string;
    version?: string;
    chainId?: number;
    verifyingContract?: string;
    salt?: ArrayBuffer;
  };
  message: Record<string, unknown>;
}

export interface TypedData extends BaseSignable {
  typedDataRaw: string;
  version: SignTypedDataVersion;
  typedDataEncoded?: Buffer;
}

export interface AddressCoinSpecific {
  outputScript?: string;
  redeemScript?: string;
  witnessScript?: string;
  baseAddress?: string;
  pendingChainInitialization?: boolean;
  forwarderVersion?: number;
}

export interface FullySignedTransaction {
  txHex: string; // Transaction in any format required by each coin, i.e. in Tron it is a stringifyed JSON
}

export interface HalfSignedUtxoTransaction {
  txHex: string;
}

export interface HalfSignedAccountTransaction {
  halfSigned?: {
    txHex?: string; // Transaction in any format required by each coin, i.e. in Tron it is a stringifyed JSON
    payload?: string;
    txBase64?: string;
  };
}

export interface HalfSignedTransaction extends HalfSignedAccountTransaction {
  halfSigned: {
    recipients: Recipient[];
    expireTime?: number;
    contractSequenceId?: number;
    sequenceId?: number;
    txHex?: never;
    isBatch?: boolean;
  };
}

export interface SignedTransactionRequest {
  txRequestId: string;
}

export interface DeriveKeyWithSeedOptions {
  key: string;
  seed: string;
}

export interface ValidMofNOptions {
  m?: number;
  n?: number;
}

export type SignedTransaction =
  | HalfSignedAccountTransaction
  | HalfSignedUtxoTransaction
  | FullySignedTransaction
  | SignedTransactionRequest
  | TxRequest;

export interface SignedMessage {
  coin?: string;
  // @deprecated - use `signature` instead
  txHash: string;
  signature: string;
  messageRaw: string;
  messageEncoded?: string;
  messageStandardType?: MessageStandardType;
  txRequestId: string;
}

export interface RecoverWalletTokenOptions {
  tokenContractAddress: string;
  wallet: IWallet;
  recipient: string;
  broadcast?: boolean;
  walletPassphrase?: string;
  prv?: string;
}

export interface Recipient {
  address: string;
  amount: string;
  data?: string;
}

export interface RecoverTokenTransaction {
  halfSigned: {
    recipient: Recipient;
    expireTime: number;
    contractSequenceId: number;
    operationHash: string;
    signature: string;
    gasLimit: number;
    gasPrice: number;
    tokenContractAddress: string;
    walletId: string;
  };
}

export interface TokenEnablementConfig {
  requiresTokenEnablement: boolean;
  supportsMultipleTokenEnablements: boolean;
}

export interface MessagePrep {
  encodeMessage(message: string): string;
}

export type MPCAlgorithm = 'ecdsa' | 'eddsa';

export type NFTTransferOptions = {
  tokenContractAddress: string;
  recipientAddress: string;
} & (
  | {
      type: 'ERC721' | TokenType.DIGITAL_ASSET;
      tokenId: string;
    }
  | {
      type: 'ERC1155';
      entries: { tokenId: string; amount: number }[];
    }
);

export type BuildNftTransferDataOptions = NFTTransferOptions & {
  fromAddress: string;
};

export interface BaseBroadcastTransactionOptions {
  serializedSignedTransaction: string;
  transactions?: MPCTx[];
}

export interface BaseBroadcastTransactionResult {
  txId?: string;
  txIds?: string[];
}

export interface IBaseCoin {
  type: string;
  tokenConfig?: BaseTokenConfig;
  getConfig(): Readonly<StaticsBaseCoin>;
  url(suffix: string): string;
  wallets(): IWallets;
  enterprises(): IEnterprises;
  keychains(): IKeychains;
  webhooks(): IWebhooks;
  pendingApprovals(): IPendingApprovals;
  markets(): IMarkets;
  getChain(): string;
  getFamily(): string;
  getFullName(): string;
  valuelessTransferAllowed(): boolean;
  checkRecipient(recipient: { address: string; amount: string | number }): void;
  sweepWithSendMany(): boolean;
  transactionDataAllowed(): boolean;
  allowsAccountConsolidations(): boolean;
  getTokenEnablementConfig(): TokenEnablementConfig;
  supportsTss(): boolean;
  supportsMultisig(): boolean;
  getDefaultMultisigType(): MultisigType | undefined;
  supportsDeriveKeyWithSeed(): boolean;
  isEVM(): boolean;
  supportsBlsDkg(): boolean;
  getBaseFactor(): number | string;
  baseUnitsToBigUnits(baseUnits: string | number): string;
  bigUnitsToBaseUnits(bigUnits: string | number): string;
  preprocessBuildParams(params: Record<string, any>): Record<string, any>;
  signMessage(key: { prv: string }, message: string): Promise<Buffer>;
  createKeySignatures(
    prv: string,
    backupKeychain: { pub: string },
    bitgoKeychain: { pub: string }
  ): Promise<{
    backup: string;
    bitgo: string;
  }>;
  explainTransaction(options: Record<string, any>): Promise<ITransactionExplanation<any, string | number> | undefined>;
  verifyTransaction(params: VerifyTransactionOptions): Promise<boolean>;
  verifyAddress(params: VerifyAddressOptions): Promise<boolean>;
  isWalletAddress(params: VerifyAddressOptions, wallet?: IWallet): Promise<boolean>;
  canonicalAddress(address: string, format: unknown): string;
  supportsBlockTarget(): boolean;
  supportsLightning(): boolean;
  supportsMessageSigning(): boolean;
  supportsSigningTypedData(): boolean;
  supplementGenerateWallet(walletParams: SupplementGenerateWalletOptions, keychains: KeychainsTriplet): Promise<any>;
  getExtraPrebuildParams(buildParams: ExtraPrebuildParamsOptions): Promise<Record<string, unknown>>;
  postProcessPrebuild(prebuildResponse: TransactionPrebuild): Promise<TransactionPrebuild>;
  presignTransaction(params: PresignTransactionOptions): Promise<PresignTransactionOptions>;
  signWithCustomSigningFunction?(
    customSigningFunction: CustomSigningFunction,
    signTransactionParams: { txPrebuild: TransactionPrebuild; pubs?: string[] }
  ): Promise<SignedTransaction>;
  newWalletObject(walletParams: any): IWallet;
  feeEstimate(params: FeeEstimateOptions): Promise<any>;
  deriveKeyWithSeed(params: DeriveKeyWithSeedOptions): { key: string; derivationPath: string };
  keyIdsForSigning(): number[];
  preCreateBitGo(params: PrecreateBitGoOptions): void;
  initiateRecovery(params: InitiateRecoveryOptions): never;
  parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction>;
  generateKeyPair(seed?: Buffer): KeyPair;
  generateRootKeyPair(seed?: Buffer): KeyPair;
  isValidPub(pub: string): boolean;
  isValidMofNSetup(params: ValidMofNOptions): boolean;
  isValidAddress(address: string): boolean;
  signTransaction(params: SignTransactionOptions): Promise<SignedTransaction>;
  getSignablePayload(serializedTx: string): Promise<Buffer>;
  getMPCAlgorithm(): MPCAlgorithm;
  // TODO - this only belongs in eth coins
  recoverToken(params: RecoverWalletTokenOptions): Promise<RecoverTokenTransaction>;
  getInscriptionBuilder(wallet: Wallet): IInscriptionBuilder;

  /**
   * Build the call data for transferring a NFT(s).
   * @param params Options specifying the token contract, token recipient & the token(s) to be transferred
   * @return the hex string for the contract call.
   */
  buildNftTransferData(params: BuildNftTransferDataOptions): string;
  getHashFunction(): Hash;
  broadcastTransaction(params: BaseBroadcastTransactionOptions): Promise<BaseBroadcastTransactionResult>;
  setCoinSpecificFieldsInIntent(intent: PopulatedIntent, params: PrebuildTransactionWithIntentOptions): void;

  /**
   * Audit a key to determine if it is valid for the coin.
   * @param {Object} params - The parameters for the audit
   * @param {string} params.publicKey  - The public portion of the key
   * @param {string} params.encryptedPrv - The encrypted private key
   * @param {string} params.walletPassphrase - The passphrase to decrypt the private key
   * @param {string} params.multiSigType - The type of multisig (e.g. 'onchain' or 'tss')
   */
  assertIsValidKey({ publicKey, encryptedPrv, walletPassphrase, multiSigType }: AuditKeyParams): void;
}
