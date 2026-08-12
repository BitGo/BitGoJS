import {
  InitiateRecoveryOptions as BaseInitiateRecoveryOptions,
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionExplanation as BaseTransactionExplanation,
  VerifyAddressOptions as BaseVerifyAddressOptions,
  TransactionPrebuild,
} from '@bitgo/sdk-core';
import {
  AccountDelete,
  AccountSet,
  Amount,
  MPTAmount,
  MPTokenAuthorize,
  Payment,
  Signer,
  SignerEntry,
  SignerListSet,
  TransactionMetadata,
  TrustSet,
} from 'xrpl';

/**
 * XRP transaction types supported by this SDK.
 *
 * The string values mirror XRPL's `TransactionType` field names exactly and are part of the
 * public SDK surface — downstream consumers (e.g. bitgo-microservices `xrpToken.ts`) compare
 * transaction types against these members with `===`/`!==`. Do NOT change the string values
 * (e.g. switch to numeric enum values) or rename members; that would silently break string
 * comparisons across the SDK boundary with no compile error.
 *
 * AMM and other newer XRPL transaction types are intentionally absent — they are rejected by
 * `Transaction.fromRawTransaction()` via the reverse-enum lookup. To add support for a new
 * type (e.g. an AMM family member), add it here with its exact XRPL name AND extend the
 * switch statements in `lib/transaction.ts` (`toJson`, `explainTransaction`,
 * `fromRawTransaction`) and the coin-level `xrp.ts:explainTransaction`.
 */
export enum XrpTransactionType {
  AccountDelete = 'AccountDelete',
  AccountSet = 'AccountSet',
  Payment = 'Payment',
  SignerListSet = 'SignerListSet',
  TrustSet = 'TrustSet',
  MPTokenAuthorize = 'MPTokenAuthorize',
}

// Re-export so consumers can import alongside other XRP types from this module.
export type { MPTAmount, MPTokenAuthorize };

export type XrpTransaction = AccountDelete | Payment | AccountSet | SignerListSet | TrustSet | MPTokenAuthorize;

export interface Address {
  address: string;
  destinationTag?: number;
}

export interface FeeInfo {
  date: string;
  height: number;
  baseReserve: string;
  baseFee: string;
}

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
  isLastSignature?: boolean;
}

export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string; // txHex is poorly named here; it is just a wrapped JSON object
  };
  /**
   * Optional XRP transaction metadata. When present and the Payment `tfPartialPayment` flag
   * is set, the explained `outputAmount` is taken from `meta.delivered_amount` (the actual
   * delivered value) instead of the requested `Amount` field. Without metadata, a partial
   * payment's delivered amount is unknown and `partialPayment: true` is surfaced instead.
   */
  meta?: TransactionMetadata;
}

export interface VerifyAddressOptions extends BaseVerifyAddressOptions {
  rootAddress: string;
}

export interface RecoveryInfo extends BaseTransactionExplanation {
  txHex: string;
  backupKey?: string;
  coin?: string;
}

export interface RecoveryTransaction {
  txHex: string;
}

export interface InitiateRecoveryOptions extends BaseInitiateRecoveryOptions {
  krsProvider?: string;
}

export interface RecoveryOptions {
  backupKey: string;
  userKey: string;
  rootAddress: string;
  recoveryDestination: string;
  bitgoKey?: string;
  walletPassphrase: string;
  krsProvider?: string;
  issuerAddress?: string;
  currencyCode?: string;
  /** When true, builds an AccountDelete transaction to withdraw the full balance
   *  including the base reserve (currently 10 XRP) instead of a normal Payment. */
  reserveWithdrawal?: boolean;
}

export interface HalfSignedTransaction {
  halfSigned: {
    txHex: string;
  };
}

export interface SupplementGenerateWalletOptions {
  rootPrivateKey?: string;
}

export type TransactionExplanation =
  | BaseTransactionExplanation
  | AccountSetTransactionExplanation
  | TrustSetTransactionExplanation
  | SignerListSetTransactionExplanation
  | MPTokenAuthorizeTransactionExplanation
  | PaymentTransactionExplanation;

export interface PaymentTransactionExplanation extends BaseTransactionExplanation {
  /**
   * True when the Payment `tfPartialPayment` flag is set, meaning the delivered amount may
   * be less than the requested `Amount`. When `meta.delivered_amount` was provided to
   * explainTransaction, `outputAmount`/`outputs[].amount` reflect the delivered value and
   * this flag is still set so consumers can distinguish partial from full delivery.
   */
  partialPayment?: boolean;
}

export interface AccountSetTransactionExplanation extends BaseTransactionExplanation {
  accountSet: {
    messageKey?: string;
    setFlag: number;
  };
}

export interface TrustSetTransactionExplanation extends BaseTransactionExplanation {
  account: string;
  limitAmount: {
    currency: string;
    issuer: string;
    value: string;
  };
}

export interface SignerListSetTransactionExplanation extends BaseTransactionExplanation {
  signerListSet: {
    signerQuorum: number;
    signerEntries: SignerEntry[];
  };
}

export interface MPTokenAuthorizeTransactionExplanation extends BaseTransactionExplanation {
  mptIssuanceId: string;
  mptHolder?: string;
}

export interface TxData {
  // mandatory fields
  from: string;
  transactionType: XrpTransactionType;
  isMultiSig: boolean;
  // optional fields
  id?: string;
  fee?: string;
  flags: number;
  sequence?: number;
  lastLedgerSequence?: number;
  signingPubKey?: string; // if '' then it is a multi sig
  txnSignature?: string; // only for single sig
  signers?: Signer[]; // only for multi sig
  // transfer xrp / account-delete fields
  destination?: string;
  destinationTag?: number;
  amount?: Amount;
  // account set fields
  messageKey?: string;
  setFlag?: number;
  // signer list set fields
  signerQuorum?: number;
  signerEntries?: SignerEntry[];
  // mpt fields
  mptIssuanceId?: string;
  mptHolder?: string; // issuer-side auth only (Phase 2) — absent for holder self-auth
  mptAmount?: MPTAmount;
}

export interface SignerDetails {
  address: string;
  weight: number;
}
