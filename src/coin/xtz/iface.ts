import { BaseFee, BaseKey } from '../baseCoin/iface';

export interface HashType {
  prefix: Buffer;
  byteLength: number;
}

export interface Operation {
  kind: string;
  counter: string;
  source: string;
  fee: string;
  gas_limit: string;
  storage_limit: string;
}

export interface RevealOp extends Operation {
  public_key: string;
}

export interface OriginationOp extends Operation {
  balance: string;
  script: any;
  delegate?: string;
}

export interface TransactionOp extends Operation {
  parameters?: any;
  destination: string;
  amount: string;
}

export interface ParsedTransaction {
  branch: string;
  contents: Operation[];
}

/**
 * Different Tezos specific fees
 */
export interface Fee extends BaseFee {
  gasLimit?: string;
  storageLimit?: string;
}

/**
 * Send transaction information
 */
export interface TransferData {
  amount: string;
  coin?: string;
  from: string;
  to: string;
  fee: Fee;
  dataToSign?: string;
  counter?: string;
}

/**
 * Origination transaction information
 */
export interface OriginationData {
  fee: Fee;
  counter?: string;
  balance?: string;
  from?: string;
  forwarderDestination?: string;
}
/**
 * Taquito return type for sign operations
 */
export interface SignResponse {
  bytes: string;
  sig: any;
  prefixSig: any;
  sbytes: string;
}

export interface IndexedData {
  index?: number;
}

/**
 * Tezos keys can have a specific order in the smart contracts, hence the need to add an index field
 */
export interface Key extends BaseKey, IndexedData {}

export interface IndexedSignature extends IndexedData {
  signature: string;
}
