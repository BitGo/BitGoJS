import {
  TransactionExplanation as BaseTransactionExplanation,
  TransactionType as BitGoTransactionType,
} from '@bitgo/sdk-core';

export const REQUEST_STATUS = 'request_status';
export const ROOT_PATH = 'm/0';
export const ACCOUNT_BALANCE_ENDPOINT = '/account/balance';
export const SUBMIT_TRANSACTION_ENDPOINT = '/construction/submit';

export enum RequestType {
  CALL = 'call',
  READ_STATE = 'read_state',
}

export enum SignatureType {
  ECDSA = 'ecdsa',
}

export enum CurveType {
  SECP256K1 = 'secp256k1',
}

export enum OperationType {
  TRANSACTION = 'TRANSACTION',
  FEE = 'FEE',
}

export enum MethodName {
  SEND_PB = 'send_pb', // send_pb is the method name for ICP transfer transaction
}

export enum Network {
  ID = '00000000000000020101', // ICP does not have different network IDs for mainnet and testnet
}

export interface IcpTransactionData {
  senderAddress: string;
  receiverAddress: string;
  amount: string;
  fee: string;
  senderPublicKeyHex: string;
  memo: number | BigInt; // memo in string is not accepted by ICP chain.
  transactionType: OperationType;
  expiryTime: number | BigInt;
}

export interface IcpPublicKey {
  hex_bytes: string;
  curve_type: string;
}

export interface IcpAccount {
  address: string;
}

export interface IcpCurrency {
  symbol: string;
  decimals: number;
}

export interface IcpAmount {
  value: string;
  currency: IcpCurrency;
}

export interface IcpOperation {
  type: string;
  account: IcpAccount;
  amount: IcpAmount;
}

export interface IcpTransactionParseMetadata {
  created_at_time: number;
  memo: number | BigInt; // memo in string is not accepted by ICP chain.
  ingress_start?: number | BigInt; // it should be nano seconds
  ingress_end?: number | BigInt; // it should be nano seconds
}

export interface IcpTransactionBuildMetadata {
  created_at_time: number;
  memo?: number | BigInt; // memo in string is not accepted by ICP chain.
  ingress_start: number | BigInt; // it should be nano seconds
  ingress_end: number | BigInt; // it should be nano seconds
}

export interface IcpTransaction {
  public_keys: IcpPublicKey[];
  operations: IcpOperation[];
  metadata: IcpTransactionBuildMetadata;
}

export interface ParsedTransaction {
  operations: IcpOperation[];
  account_identifier_signers: IcpAccount[];
  metadata: IcpTransactionParseMetadata;
}

export interface IcpAccountIdentifier {
  address: string;
}

export interface SendArgs {
  memo: { memo: number | BigInt };
  payment: { receiverGets: { e8s: number } };
  maxFee: { e8s: number };
  to: { hash: Buffer };
  createdAtTime: { timestampNanos: number };
}

export interface HttpCanisterUpdate {
  canister_id: Uint8Array;
  method_name: MethodName;
  arg: Uint8Array;
  sender: Uint8Array;
  ingress_expiry: bigint;
}

export interface SigningPayload {
  account_identifier: IcpAccountIdentifier;
  hex_bytes: string;
  signature_type: SignatureType;
}

export interface PayloadsData {
  payloads: SigningPayload[];
  unsigned_transaction: string;
}

export interface Signatures {
  signing_payload: SigningPayload;
  signature_type: SignatureType;
  public_key: IcpPublicKey;
  hex_bytes: string;
}

export interface CborUnsignedTransaction {
  updates: [string, HttpCanisterUpdate][];
  ingress_expiries: bigint[];
}

export interface ReadState {
  sender: Uint8Array;
  paths: Array<[Buffer, Buffer]>;
  ingress_expiry: bigint;
}

export interface UpdateEnvelope {
  content: {
    request_type: RequestType;
    canister_id: Uint8Array;
    method_name: MethodName;
    arg: Uint8Array;
    sender: Uint8Array;
    ingress_expiry: bigint;
  };
  sender_pubkey: Uint8Array;
  sender_sig: Uint8Array;
}

export interface ReadStateEnvelope {
  content: ReadState & {
    request_type: RequestType;
  };
  sender_pubkey: Uint8Array;
  sender_sig: Uint8Array;
}

export interface RequestEnvelope {
  update: UpdateEnvelope;
  read_state: ReadStateEnvelope;
}

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id?: string;
  sender: string;
  senderPublicKey: string;
  recipient: string;
  memo: number | BigInt;
  feeAmount: string;
  expirationTime: number | BigInt;
  type?: BitGoTransactionType;
}

export interface IcpTransactionExplanation extends BaseTransactionExplanation {
  sender?: string;
  type?: BitGoTransactionType;
}

export interface NetworkIdentifier {
  blockchain: string;
  network: string;
}

export interface SignedTransactionRequest {
  network_identifier: NetworkIdentifier;
  signed_transaction: string;
}

export interface RecoveryOptions {
  userKey: string; // Box A
  backupKey: string; // Box B
  bitgoKey?: string;
  rootAddress?: string;
  recoveryDestination: string;
  walletPassphrase?: string;
  memo?: number | BigInt;
  krsProvider?: string;
}
