import { CLValue, PublicKey, RuntimeArgs } from 'casper-client-sdk';
import { BigNumberish } from '@ethersproject/bignumber';
import { KeyPair } from '.';

export interface CasperTransaction {
  hash: string;
  from: string;
  data: string;
  fee: number;
  startTime?: string;
  expiration?: string;
  to?: string;
  amount?: string;
  transferId?: number;
}

export interface CasperNode {
  nodeUrl: string;
}

export interface SignatureData {
  signature: string;
  keyPair: KeyPair;
}

export interface Fee {
  gasLimit: string;
  gasPrice?: string;
}

export interface CasperTransferTransaction {
  amount: BigNumberish;
  target: PublicKey;
  id?: number;
}

export interface CasperModuleBytesTransaction {
  moduleBytes: Uint8Array;
  args: RuntimeArgs;
}

export interface Owner {
  address: PublicKey;
  weight: number;
}

export interface RunTimeArg {
  action: CLValue;
  weight: CLValue;
  account?: CLValue;
}
