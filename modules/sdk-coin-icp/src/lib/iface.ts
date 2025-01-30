export interface IcpTransactionData {
  readonly senderAddress: string;
  readonly receiverAddress: string;
  readonly amount: string;
  readonly fee: string;
  readonly senderPublicKeyHex: string;
  readonly sequenceNumber: number;
  readonly transactionType: string;
  readonly expireTime: number;
  readonly coin: string;
  readonly id: string;
}

export enum IcpTransactionType {
  Transfer = 'Transfer',
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

export interface IcpUnsignedTransaction {
  unsigned_transaction: string;
  payloads: IcpPayload[];
}

export interface IcpPayload {
  account_identifier: IcpAccountIdentifier;
  hex_bytes: string;
  signature_type: string;
}

export interface IcpAccountIdentifier {
  address: string;
}

export interface IcpSignature {
  signing_payload: IcpPayload;
  signature_type: string;
  public_key: IcpPublicKey;
  hex_bytes: string;
}

export interface IcpCombineApiPayload {
  network_identifier: IcpNetworkIdentifier;
  unsigned_transaction: string;
  signatures: IcpSignature[];
}
