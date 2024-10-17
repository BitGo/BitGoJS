import {
  InitiateRecoveryOptions as BaseInitiateRecoveryOptions,
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionExplanation as BaseTransactionExplanation,
  VerifyAddressOptions as BaseVerifyAddressOptions,
  TransactionPrebuild,
} from '@bitgo/sdk-core';
import { AccountSet, Amount, Payment, Signer, SignerEntry, SignerListSet, TrustSet } from 'xrpl';

export enum XrpTransactionType {
  AccountSet = 'AccountSet',
  Payment = 'Payment',
  SignerListSet = 'SignerListSet',
  TrustSet = 'TrustSet',
}

export type XrpTransaction = Payment | AccountSet | SignerListSet | TrustSet;

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
  | SignerListSetTransactionExplanation;

export interface AccountSetTransactionExplanation extends BaseTransactionExplanation {
  accountSet: {
    messageKey?: string;
    setFlag: number;
  };
}

export interface SignerListSetTransactionExplanation extends BaseTransactionExplanation {
  signerListSet: {
    signerQuorum: number;
    signerEntries: SignerEntry[];
  };
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
  // transfer xrp fields
  destination?: string;
  destinationTag?: number;
  amount?: Amount;
  // account set fields
  messageKey?: string;
  setFlag?: number;
  // signer list set fields
  signerQuorum?: number;
  signerEntries?: SignerEntry[];
}

export interface SignerDetails {
  address: string;
  weight: number;
}
