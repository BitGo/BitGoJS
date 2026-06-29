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
  TrustSet,
} from 'xrpl';

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
  | MPTokenAuthorizeTransactionExplanation;

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
