import { Keychain } from './iKeychains';
import { IWallet } from './iWallet';

export interface TransactionPrebuild {
  txBase64?: string;
  txHex?: string;
  txInfo?: unknown;
  wallet?: IWallet;
  buildParams?: any;
  consolidateId?: string;
  txRequestId?: string;
}

export interface AddressCoinSpecific {
  outputScript?: string;
  redeemScript?: string;
  witnessScript?: string;
  baseAddress?: string;
  pendingChainInitialization?: boolean;
  forwarderVersion?: number;
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

export interface SignedTransactionRequest {
  txRequestId: string;
}

export type SignedTransaction =
  | HalfSignedAccountTransaction
  | HalfSignedUtxoTransaction
  | FullySignedTransaction
  | SignedTransactionRequest;

export interface IBaseCoin {
  placeholder: unknown;
}
