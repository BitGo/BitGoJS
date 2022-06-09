import BigNumber from 'bignumber.js';

/**
 * Basic coin recipient information
 */
export interface Recipient {
  address: string;
  amount: string;
}
/*
 * Types for Polkadot
 */
export type Output = {
  address: string;
  // of form coin:token
  coinName?: string;
  isPayGo?: boolean;
  value?: number;
  wallet?: string // Types.ObjectId;
  walletV1?: string // Types.ObjectId;
  baseAddress?: string;
  enterprise?: string // Types.ObjectId;
  valueString: string;
  data?: string;
  // "change" is a utxo-specific concept and this property should
  // be removed once it it's usage is refactored out of base coin logic
  change?: boolean;
};

export type Input = {
  derivationIndex?: number;
  value: number;
  address?: string;
  valueString: string;
  // the properties below are utxo-related but are currently used in abstractBaseCoin
  // these should be removed once their usage is removed from the base coin class
  chain?: number;
  index?: number;
};

export type ParsedTransaction = {
  inputs: Input[];
  minerFee: number | string;
  outputs: Output[];
  spendAmount: number | string;
  hasUnvalidatedData?: boolean;
  payGoFee?: number;
  type?: string;
  sequenceId: number;
  id: string;
};

export type UnsignedTransaction = {
  // unsigned transaction in broadcast format
  serializedTxHex: string;
  // portion of a transaction used to generate a signature
  signableHex: string;
  // transaction fees
  feeInfo?: {
    fee: number | BigNumber;
    feeString: string;
  };
  // derivation path of the signer
  derivationPath: string;
  coinSpecific?: Record<string, unknown>;
  entryValues: any;
  parsedTx: ParsedTransaction;
};

export type ExplanationResult = {
  sequenceId: number;
  feeInfo?: string;
  txid: string;
  type?: string;
  outputs: Output[];
  blockNumber: number | unknown;
  changeOutputs: [];
  changeAmount: string;
}
