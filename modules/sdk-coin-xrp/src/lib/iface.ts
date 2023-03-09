import {
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionExplanation as BaseTransactionExplanation,
  ParseTransactionOptions as BaseParseTransactionOptions,
  TransactionPrebuild,
  VerifyAddressOptions as BaseVerifyAddressOptions,
  ParsedTransaction as BaseParsedTransaction,
} from '@bitgo/sdk-core';
import { AccountSet, Payment, SignerListSet } from 'xrpl';
import { Signer, SignerEntry } from 'xrpl/dist/npm/models/common';
import { XrpAllowedTransactionTypes } from './enum';

export interface Address {
  address: string;
  destinationTag?: number;
}

export type XrpTransactions = Payment | AccountSet | SignerListSet;

export interface TxData {
  // mandatory fields
  from: string;
  transactionType: XrpAllowedTransactionTypes;
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
  amount?: string;
  // account set fields
  messageKey?: string;
  setFlag?: number;
  // signer list set fields
  signerQuorum?: number;
  signerEntries?: SignerEntry[];
}

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface ExplainTransactionOptions {
  txHex: string;
}

export interface VerifyAddressOptions extends BaseVerifyAddressOptions {
  rootAddress: string;
}

export interface RecoveryInfo extends BaseTransactionExplanation {
  txHex: string;
  backupKey?: string;
  coin?: string;
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

export interface ParseTransactionOptions extends BaseParseTransactionOptions {
  txHex: string;
}

export interface TransactionOutput {
  address: string;
  amount: number | string;
}

type TransactionInput = TransactionOutput;

export interface ParsedTransaction extends BaseParsedTransaction {
  // total assets being moved, including fees
  inputs: TransactionInput[];

  // where assets are moved to
  outputs: TransactionOutput[];
}

export interface SignerDetails {
  address: string;
  weight: number;
}
