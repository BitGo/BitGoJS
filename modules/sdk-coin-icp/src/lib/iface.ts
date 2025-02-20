import { TransactionType } from '@bitgo/sdk-core';

export const RequestType = {
  CALL: 'call',
  READ_STATE: 'read_state',
};

export interface IcpTransactionData {
  readonly senderAddress: string;
  readonly receiverAddress: string;
  readonly amount: string;
  readonly fee: string;
  readonly senderPublicKeyHex: string;
  readonly memo: number;
  readonly transactionType: TransactionType;
  readonly expireTime: number;
}

export interface IcpNetworkIdentifier {
  blockchain: string;
  network: string;
}

export interface IcpPublicKey {
  hex_bytes: string;
  curve_type: string;
}

export interface IcpOperationIdentifier {
  index: number;
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
  operation_identifier: IcpOperationIdentifier;
  type: string;
  account: IcpAccount;
  amount: IcpAmount;
}

export interface IcpMetadata {
  created_at_time: number;
  memo: number;
  ingress_start: number;
  ingress_end: number;
}

export interface IcpTransaction {
  network_identifier: IcpNetworkIdentifier;
  public_keys: IcpPublicKey[];
  operations: IcpOperation[];
  metadata: IcpMetadata;
}

export interface IcpAccountIdentifier {
  address: string;
}

export interface SendArgs {
  memo: { memo: number };
  payment: { receiverGets: { e8s: number } };
  maxFee: { e8s: number };
  to: { hash: Buffer };
  createdAtTime: { timestampNanos: number };
}

export interface HttpCanisterUpdate {
  canister_id: Uint8Array;
  method_name: string;
  arg: Uint8Array;
  sender: Uint8Array;
  ingress_expiry: bigint;
}
export interface SigningPayload {
  account_identifier: IcpAccountIdentifier;
  hex_bytes: string;
  signature_type: string;
}
export interface PayloadsData {
  payloads: SigningPayload[];
  unsigned_transaction: string;
}
