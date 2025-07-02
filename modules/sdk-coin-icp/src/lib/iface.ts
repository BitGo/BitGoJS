import {
  TransactionExplanation as BaseTransactionExplanation,
  TransactionType as BitGoTransactionType,
} from '@bitgo/sdk-core';
import { Principal } from '@dfinity/principal';

export const MAX_INGRESS_TTL = 5 * 60 * 1000_000_000; // 5 minutes in nanoseconds
export const PERMITTED_DRIFT = 60 * 1000_000_000; // 60 seconds in nanoseconds
export const LEDGER_CANISTER_ID = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 2, 1, 1]); // ryjl3-tyaaa-aaaaa-aaaba-cai
export const GOVERNANCE_CANISTER_ID = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 1]); // rrkah-fqaaa-aaaaa-aaaaq-cai
export const ROOT_PATH = 'm/0';
export const ACCOUNT_BALANCE_CALL = 'icrc1_balance_of';
export const PUBLIC_NODE_REQUEST_ENDPOINT = '/api/v3/canister/';
export const DEFAULT_MEMO = 0; // default memo value is 0
export const ICRC1_FEE_KEY = 'icrc1:fee';
export const METADATA_CALL = 'icrc1_metadata';
export const DEFAULT_SUBACCOUNT = '0000000000000000000000000000000000000000000000000000000000000000'; // default subaccount value is 0x

export enum RequestType {
  CALL = 'call',
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

export enum Topic {
  Unspecified = 0,
  Governance = 1,
  SnsAndCommunityFund = 2,
  NetworkEconomics = 3,
  Node = 4,
  ParticipantManagement = 5,
  SubnetManagement = 6,
  NetworkCanisterManagement = 7,
  KYC = 8,
  NodeProviderRewards = 9,
}

export enum Vote {
  Unspecified = 0,
  Yes = 1,
  No = 2,
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

export interface MetaData {
  created_at_time: number;
  memo: number | BigInt; // memo in string is not accepted by ICP chain.
  ingress_start?: number | BigInt; // it should be nano seconds
  ingress_end?: number | BigInt; // it should be nano seconds
}

export interface IcpTransaction {
  public_keys: IcpPublicKey[];
  operations: IcpOperation[];
  metadata: MetaData;
}

export interface ParsedTransaction {
  operations: IcpOperation[];
  account_identifier_signers: IcpAccount[];
  metadata: MetaData;
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

//Todo: remove this interface when we have a better way to handle the transaction
export interface CborUnsignedTransaction {
  updates: [HttpCanisterUpdate][];
  ingress_expiries: bigint[];
}

export interface UpdateEnvelope {
  content: HttpCanisterUpdate & {
    request_type: RequestType;
  };
  sender_pubkey: Uint8Array;
  sender_sig: Uint8Array;
}

export interface RequestEnvelope {
  update: UpdateEnvelope;
}

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id?: string;
  sender: string;
  senderPublicKey: string;
  recipient: string;
  memo?: number | BigInt;
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

export interface RawTransaction {
  serializedTxHex: PayloadsData;
  publicKey: string;
}

export interface RecoveryOptions {
  userKey: string; // Box A
  backupKey: string; // Box B
  bitgoKey?: string;
  rootAddress?: string;
  recoveryDestination: string;
  walletPassphrase: string;
  memo?: number | BigInt;
}

export interface RecoveryTransaction {
  id: string;
  tx: string;
}

export enum HotkeyPermission {
  VOTE = 'VOTE',
  FOLLOW = 'FOLLOW',
  DISSOLVE = 'DISSOLVE',
  CONFIGURE = 'CONFIGURE',
}

export interface HotkeyStatus {
  principal: Principal;
  permissions: HotkeyPermission[];
  addedAt: number;
  lastUsed?: number;
}

export interface FullNeuron {
  controller: Principal;
  hotKeys: Principal[];
  hotkeyDetails?: HotkeyStatus[];
  dissolveDelaySeconds: number;
  votingPower: bigint;
  state: string;
}

export interface NeuronInfo {
  neuronId: bigint;
  fullNeuron?: FullNeuron;
  dissolveDelaySeconds: number;
  votingPower: bigint;
  state: string;
}

export interface UnsignedSweepRecoveryTransaction {
  txHex: string;
  coin: string;
}

export interface PublicNodeSubmitResponse {
  status: string;
}

export interface AccountIdentifierHash {
  hash: Buffer<ArrayBuffer>;
}

export interface TransactionHexParams {
  transactionHex: string;
  signableHex?: string;
}

export interface ProposalInfo {
  proposalId: bigint;
  title: string;
  topic: Topic;
  status: string;
  summary: string;
  proposer: Principal;
  created: number;
}

export interface ClaimNeuronParams {
  controller: Principal;
  memo: bigint;
}

export interface SetFolloweesParams {
  neuronId: bigint;
  topic: Topic;
  followees: bigint[];
}

export interface DissolveDelayParams {
  neuronId: bigint;
  dissolveDelaySeconds: number;
}
