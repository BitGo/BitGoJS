import { CLValue, PublicKey } from 'casper-client-sdk';
import { BigNumberish } from '@ethersproject/bignumber';
import { KeyPair } from '.';

export interface TxData {
  id: string;
  hash?: string;
  from: string;
  data: string;
  fee: number;
  startTime: string;
  validDuration: string;
  node: string;
  memo?: string;
  to?: string;
  amount?: string;
}

export interface CasperNode {
  nodeId: string;
}

export interface SignatureData {
  signature: string;
  keyPair: KeyPair;
}

export interface GasFee {
  gasLimit: string;
  gasPrice?: string;
}

export interface CasperTransferTransaction {
  amount: BigNumberish;
  target: PublicKey;
}

export interface CasperModuleBytesTransaction {
  moduleBytes: Uint8Array;
  args: Uint8Array;
}

export interface Owner {
  address: string;
  weight: number;
}

export interface RunTimeArg {
  action: CLValue;
  weight: CLValue;
  account?: CLValue;
}
